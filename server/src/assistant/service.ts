import { nanoid } from "nanoid";
import { config } from "../config.js";
import { getDb } from "../db/index.js";
import { getAiProvider } from "../providers/index.js";
import {
  formatChunksForPrompt,
  retrieveRelevantChunksWithScores,
} from "../rag/retrieve.js";
import { notifyLead } from "../notifications/index.js";
import {
  CONSENT_VERSION,
  buildSystemPrompt,
  consentNoticeText,
  strings,
} from "./prompts.js";
import {
  buildCannotAnswerReply,
  buildDutyGuidanceReply,
  buildOutOfScopeReply,
  detectDutyRateQuestion,
  detectHugeEnquiry,
  detectOutOfScope,
  extractLeadHints,
  hasContactPii,
  isLogisticsTopic,
  mergeLead,
  parseModelJson,
  runOutputGuardrails,
} from "./guardrails.js";
import {
  buildIntentResponse,
  classifyClientIntent,
  isHighConfidenceIntent,
} from "./intents.js";
import type { AiChatResult, ChatMessage, LeadFields } from "../types.js";

function now() {
  return new Date().toISOString();
}

function track(eventType: string, conversationId?: string, meta?: Record<string, unknown>) {
  getDb()
    .prepare(
      `INSERT INTO analytics_events (id, event_type, conversation_id, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(nanoid(), eventType, conversationId ?? null, meta ? JSON.stringify(meta) : null, now());
}

export function getOrCreateConversation(input: {
  conversationId?: string;
  sessionId: string;
  language?: string;
  ip?: string;
  userAgent?: string;
}) {
  const database = getDb();
  if (input.conversationId) {
    const existing = database
      .prepare(`SELECT * FROM conversations WHERE id = ?`)
      .get(input.conversationId) as { id: string } | undefined;
    if (existing) return existing.id;
  }

  const id = nanoid();
  const ts = now();
  database
    .prepare(
      `INSERT INTO conversations (id, session_id, language, started_at, updated_at, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.sessionId,
      input.language && config.allowedLanguages.includes(input.language)
        ? input.language
        : config.defaultLanguage,
      ts,
      ts,
      input.ip ?? null,
      input.userAgent ?? null
    );
  track("conversation_started", id);
  return id;
}

function getHistory(conversationId: string): ChatMessage[] {
  const rows = getDb()
    .prepare(
      `SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 40`
    )
    .all(conversationId) as Array<{ role: string; content: string }>;
  return rows
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
}

function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  citations?: string[]
) {
  getDb()
    .prepare(
      `INSERT INTO messages (id, conversation_id, role, content, citations_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      nanoid(),
      conversationId,
      role,
      content,
      citations ? JSON.stringify(citations) : null,
      now()
    );
  getDb()
    .prepare(
      `UPDATE conversations SET updated_at = ?, message_count = message_count + 1 WHERE id = ?`
    )
    .run(now(), conversationId);
}

function getConsent(conversationId: string) {
  return getDb()
    .prepare(`SELECT * FROM consents WHERE conversation_id = ? ORDER BY consented_at DESC LIMIT 1`)
    .get(conversationId) as { id: string } | undefined;
}

function getLatestLead(conversationId: string): LeadFields | undefined {
  const row = getDb()
    .prepare(`SELECT * FROM leads WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(conversationId) as Record<string, string> | undefined;
  if (!row) return undefined;
  return {
    commodity: row.commodity || undefined,
    volume: row.volume || undefined,
    origin: row.origin || undefined,
    destination: row.destination || undefined,
    timeline: row.timeline || undefined,
    name: row.name || undefined,
    company: row.company || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    intentType: row.intent_type || undefined,
  };
}

export function recordConsent(input: {
  conversationId: string;
  ip?: string;
  lead?: Pick<LeadFields, "name" | "company" | "email" | "phone">;
}) {
  const id = nanoid();
  getDb()
    .prepare(
      `INSERT INTO consents (id, conversation_id, consent_version, consent_text, consented_at, ip)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.conversationId, CONSENT_VERSION, consentNoticeText(), now(), input.ip ?? null);
  track("consent_granted", input.conversationId);

  let leadId: string | undefined;
  const lead = input.lead;
  const hasContact =
    Boolean(lead?.email?.trim()) || Boolean(lead?.phone?.trim()) || Boolean(lead?.name?.trim());
  if (lead && hasContact) {
    leadId = persistLead({
      conversationId: input.conversationId,
      lead: { ...lead, intentType: "callback" },
      isHuge: false,
      consentId: id,
    });
    void notifyLead({
      leadId,
      intentType: "callback",
      isHuge: false,
      escalate: true,
      lead: { ...lead, intentType: "callback" },
      conversationExcerpt: `Consent + callback form for conversation ${input.conversationId}`,
    });
  }

  return { consentId: id, version: CONSENT_VERSION, text: consentNoticeText(), leadId };
}

function persistLead(input: {
  conversationId: string;
  lead: LeadFields;
  isHuge: boolean;
  consentId?: string;
}) {
  const history = getHistory(input.conversationId);
  const full = history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const id = nanoid();
  getDb()
    .prepare(
      `INSERT INTO leads (
        id, conversation_id, commodity, volume, origin, destination, timeline,
        name, company, email, phone, full_conversation, intent_type, status,
        is_huge, consent_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`
    )
    .run(
      id,
      input.conversationId,
      input.lead.commodity ?? null,
      input.lead.volume ?? null,
      input.lead.origin ?? null,
      input.lead.destination ?? null,
      input.lead.timeline ?? null,
      input.lead.name ?? null,
      input.lead.company ?? null,
      input.lead.email ?? null,
      input.lead.phone ?? null,
      full,
      input.lead.intentType ?? "enquiry",
      input.isHuge ? 1 : 0,
      input.consentId ?? null,
      now()
    );
  track("lead_captured", input.conversationId, {
    intent: input.lead.intentType,
    huge: input.isHuge,
  });
  return id;
}

async function finalizeParsedChat(input: {
  conversationId: string;
  userMessage: string;
  parsed: AiChatResult;
  consent?: { id: string };
  leadSoFar: LeadFields;
  locale: keyof typeof strings;
  retrievalSufficient: boolean;
  fromIntent?: boolean;
}) {
  const copy = strings[input.locale] ?? strings.en;
  const { conversationId, userMessage, consent, leadSoFar, retrievalSufficient, fromIntent } =
    input;
  let parsed = input.parsed;

  if (!fromIntent) {
    const preGuard = runOutputGuardrails(parsed.reply, userMessage);
    if (!retrievalSufficient && isLogisticsTopic(userMessage)) {
      parsed = { ...parsed, cannotAnswerFromKb: true };
      if (parsed.reply.length < 40 || preGuard.flags.includes("nav_garbage")) {
        parsed = { ...parsed, reply: buildCannotAnswerReply() };
      }
    }
    if (parsed.cannotAnswerFromKb && !retrievalSufficient) {
      parsed = { ...parsed, reply: buildCannotAnswerReply() };
    }
  }

  const finalGuard = runOutputGuardrails(parsed.reply, userMessage);
  const hintLead = extractLeadHints(userMessage);
  const mergedLead = mergeLead(mergeLead(leadSoFar, hintLead), parsed.lead);
  const huge = detectHugeEnquiry(userMessage, mergedLead.volume);
  if (huge) {
    getDb()
      .prepare(`UPDATE conversations SET huge_enquiry = 1, serious_enquiry = 1 WHERE id = ?`)
      .run(conversationId);
  } else if (parsed.seriousEnquiry) {
    getDb()
      .prepare(`UPDATE conversations SET serious_enquiry = 1 WHERE id = ?`)
      .run(conversationId);
  }

  let reply = finalGuard.sanitized;
  const wantsPii = hasContactPii(parsed.lead) || parsed.needsConsent || parsed.escalate;

  if (hasContactPii(mergedLead) && !consent) {
    reply += `\n\n${copy.consentRequired}`;
  }

  saveMessage(conversationId, "assistant", reply, parsed.citations);

  let leadId: string | undefined;
  const shouldCapture =
    parsed.seriousEnquiry || parsed.escalate || huge || hasContactPii(mergedLead);
  const pii = hasContactPii(mergedLead);

  if (shouldCapture) {
    const storeLead: LeadFields =
      pii && !consent
        ? {
            commodity: mergedLead.commodity,
            volume: mergedLead.volume,
            origin: mergedLead.origin,
            destination: mergedLead.destination,
            timeline: mergedLead.timeline,
            intentType: mergedLead.intentType,
          }
        : mergedLead;

    const mayNotify =
      huge ||
      parsed.escalate ||
      (consent && pii) ||
      (!pii && (parsed.seriousEnquiry || huge));

    if (mayNotify && (Object.keys(storeLead).length || huge || parsed.escalate)) {
      leadId = persistLead({
        conversationId,
        lead: storeLead,
        isHuge: huge,
        consentId: consent?.id,
      });
      await notifyLead({
        leadId,
        intentType: storeLead.intentType ?? (huge ? "huge_enquiry" : "enquiry"),
        isHuge: huge,
        escalate: parsed.escalate || huge,
        lead: storeLead,
        conversationExcerpt: getHistory(conversationId)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n"),
      });
      track("lead_notified", conversationId, { huge, escalate: parsed.escalate });
    }
  }

  return {
    conversationId,
    reply,
    citations: parsed.citations,
    seriousEnquiry: parsed.seriousEnquiry || huge,
    escalate: parsed.escalate || huge,
    needsConsent: Boolean(wantsPii && !consent),
    cannotAnswerFromKb: parsed.cannotAnswerFromKb,
    consent: {
      required: !consent && wantsPii,
      version: CONSENT_VERSION,
      text: consentNoticeText(),
    },
    lead: mergedLead,
    leadId,
    guardFlags: finalGuard.flags,
    offline: false,
  };
}

export async function handleChat(input: {
  conversationId?: string;
  sessionId: string;
  message: string;
  language?: string;
  ip?: string;
  userAgent?: string;
}) {
  const conversationId = getOrCreateConversation(input);
  const locale = (input.language && config.allowedLanguages.includes(input.language)
    ? input.language
    : config.defaultLanguage) as keyof typeof strings;
  const copy = strings[locale] ?? strings.en;

  saveMessage(conversationId, "user", input.message);
  track("question_asked", conversationId);

  const consent = getConsent(conversationId);
  const leadSoFar = getLatestLead(conversationId) ?? {};

  if (detectOutOfScope(input.message)) {
    const reply = buildOutOfScopeReply();
    saveMessage(conversationId, "assistant", reply);
    return {
      conversationId,
      reply,
      citations: [],
      seriousEnquiry: false,
      escalate: false,
      needsConsent: false,
      cannotAnswerFromKb: true,
      consent: {
        required: false,
        version: CONSENT_VERSION,
        text: consentNoticeText(),
      },
      lead: leadSoFar,
      offline: false,
    };
  }

  if (detectDutyRateQuestion(input.message)) {
    const reply = buildDutyGuidanceReply();
    saveMessage(conversationId, "assistant", reply);
    return {
      conversationId,
      reply,
      citations: [],
      seriousEnquiry: isLogisticsTopic(input.message),
      escalate: false,
      needsConsent: false,
      cannotAnswerFromKb: false,
      consent: {
        required: false,
        version: CONSENT_VERSION,
        text: consentNoticeText(),
      },
      lead: leadSoFar,
      offline: false,
    };
  }

  const retrieval = await retrieveRelevantChunksWithScores(input.message, 6);

  const intent = classifyClientIntent(input.message);
  const intentParsed = buildIntentResponse(intent, input.message, retrieval.chunks);
  if (intentParsed && isHighConfidenceIntent(intent)) {
    track("intent_routed", conversationId, { intent });
    return finalizeParsedChat({
      conversationId,
      userMessage: input.message,
      parsed: intentParsed,
      consent,
      leadSoFar,
      locale,
      retrievalSufficient: retrieval.sufficient,
      fromIntent: true,
    });
  }

  const kbContext = retrieval.sufficient
    ? formatChunksForPrompt(retrieval.chunks)
    : "NO_RELEVANT_KB_CHUNKS_FOUND";

  const system = buildSystemPrompt({
    language: locale,
    kbContext,
    kbSufficient: retrieval.sufficient,
    leadSoFar,
    hasConsent: Boolean(consent),
  });

  const history = getHistory(conversationId);
  const messages = history.slice(-12);

  const wantsPremium =
    intent === "quote_enquiry" ||
    detectHugeEnquiry(input.message) ||
    /\b(quote|ship|import|export|clearance|container|teu|cargo|enquiry|rfq)\b/i.test(
      input.message
    ) ||
    Boolean(leadSoFar.commodity || leadSoFar.volume || leadSoFar.origin);

  let parsed;
  try {
    const provider = getAiProvider();
    const { text } = await provider.chat({
      system,
      messages,
      model: wantsPremium ? config.aiModelPremium : undefined,
    });
    parsed = parseModelJson(text);
  } catch (err) {
    console.error("[chat] AI error, trying KB fallback", err);
    try {
      const { KbFallbackProvider } = await import("../providers/kbFallback.js");
      const { text } = await new KbFallbackProvider().chat({ system, messages });
      parsed = parseModelJson(text);
    } catch {
      const fallback = copy.fallback;
      saveMessage(conversationId, "assistant", fallback);
      return {
        conversationId,
        reply: fallback,
        citations: [] as string[],
        seriousEnquiry: true,
        escalate: true,
        needsConsent: !consent,
        consent: {
          required: !consent,
          version: CONSENT_VERSION,
          text: consentNoticeText(),
        },
        lead: leadSoFar,
        offline: true,
      };
    }
  }

  const guarded = runOutputGuardrails(parsed.reply, input.message);

  if (!retrieval.sufficient && isLogisticsTopic(input.message)) {
    parsed.cannotAnswerFromKb = true;
    if (parsed.reply.length < 40 || guarded.flags.includes("nav_garbage")) {
      parsed.reply = buildCannotAnswerReply();
    }
  }

  if (parsed.cannotAnswerFromKb && !retrieval.sufficient) {
    parsed.reply = buildCannotAnswerReply();
  }

  parsed.reply = guarded.sanitized;

  return finalizeParsedChat({
    conversationId,
    userMessage: input.message,
    parsed,
    consent,
    leadSoFar,
    locale,
    retrievalSufficient: retrieval.sufficient,
  });
}

export function requestDeletion(input: {
  email?: string;
  phone?: string;
  conversationId?: string;
  reason?: string;
}) {
  const id = nanoid();
  getDb()
    .prepare(
      `INSERT INTO deletion_requests (id, email, phone, conversation_id, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    )
    .run(
      id,
      input.email ?? null,
      input.phone ?? null,
      input.conversationId ?? null,
      input.reason ?? null,
      now()
    );
  track("deletion_requested", input.conversationId, { hasEmail: Boolean(input.email) });
  return { requestId: id, status: "pending" as const };
}

export function runRetentionCleanup() {
  const months = config.retentionMonths;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffIso = cutoff.toISOString();
  const database = getDb();

  const oldLeads = database
    .prepare(`SELECT id FROM leads WHERE created_at < ? AND anonymized_at IS NULL`)
    .all(cutoffIso) as Array<{ id: string }>;

  const anon = database.prepare(`
    UPDATE leads SET
      name = NULL,
      company = CASE WHEN company IS NOT NULL THEN 'REDACTED' ELSE NULL END,
      email = NULL,
      phone = NULL,
      full_conversation = '[anonymized after retention window]',
      anonymized_at = ?
    WHERE id = ?
  `);

  const wipeMessages = database.prepare(`
    DELETE FROM messages WHERE conversation_id IN (
      SELECT conversation_id FROM leads WHERE id = ?
    ) AND created_at < ?
  `);

  const tx = database.transaction(() => {
    for (const row of oldLeads) {
      anon.run(now(), row.id);
      wipeMessages.run(row.id, cutoffIso);
    }
  });
  tx();

  return { anonymizedLeads: oldLeads.length, cutoff: cutoffIso };
}
