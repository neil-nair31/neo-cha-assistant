import type { AiChatResult, LeadFields } from "../types.js";

const PRICE_RE =
  /(?:₹|rs\.?|inr|usd|\$|eur|€)\s?\d[\d,]*(?:\.\d+)?|\b\d+\s?(?:per\s)?(?:teu|cntr|container|kg|ton|mt)\b.*\b(?:rate|price|cost|charge|fee)/i;
const DUTY_PCT_RE =
  /\b(?:customs\s+)?duty\s+(?:is|at|of|about|around|=|:)?\s*\d{1,2}(?:\.\d+)?\s?%|\b\d{1,2}(?:\.\d+)?\s?%\s+(?:bcd|igst|duty|customs)/i;
const TIMELINE_PROMISE_RE =
  /\b(?:we\s+will|guaranteed?|promise[sd]?|definitely|assured)\s+(?:clear|deliver|arrive|complete).{0,40}\b(?:hour|day|week|today|tomorrow)\b/i;
const LEGAL_BINDING_RE =
  /\b(?:this\s+constitutes\s+legal\s+advice|you\s+are\s+legally\s+required|binding\s+legal)\b/i;

const LOGISTICS_TOPIC_RE =
  /\b(customs|clearance|import|export|ship|shipping|container|cha|freight|port|neo logistics|neo group|aeo|duty|bill of entry|shipping bill|cargo|logistics|warehouse|incoterm|hs code|broker|teu|bl\b|b\/l|mto|stevedor|forward|consign|iec|gst|icegate|multimodal|warehousing|cashew|steel|chemical|textile|mining|documentation|kyc|quote|enquiry|clearance|brokerage)\b/i;

/** Topics that are clearly not logistics even if a city name appears */
const CLEARLY_OFF_TOPIC_RE =
  /\b(pizza|restaurant|recipe|cook|cooking|movie|film|hotel stay|nightlife|tourist|sightseeing|weather forecast|best bar|cricket|ipl|football|soccer|bitcoin|crypto|dating|homework)\b/i;

const INTERNAL_UNKNOWN_RE =
  /\b(employee parking|staff parking|payroll|salary|leave policy|hr policy|office cafeteria|employee handbook)\b/i;

const OUT_OF_SCOPE_RE =
  /\b(ipl|cricket|football|soccer|basketball|movie|film|actor|actress|recipe|cook|weather forecast|bitcoin|crypto|stock price|share price|who will win|election|politics|dating|relationship advice|medical advice|homework|math problem)\b/i;

const NAV_GARBAGE_RE =
  /\b(home \(current\)|about us|our expertise|know your customer|media center|financials|contact us|login|auto-synced from neo)\b/i;

export function isLogisticsTopic(text: string): boolean {
  if (CLEARLY_OFF_TOPIC_RE.test(text.toLowerCase())) return false;
  if (INTERNAL_UNKNOWN_RE.test(text.toLowerCase())) return false;
  return LOGISTICS_TOPIC_RE.test(text);
}

export function detectOutOfScope(text: string): boolean {
  const t = text.toLowerCase();
  if (OUT_OF_SCOPE_RE.test(t)) return true;
  if (CLEARLY_OFF_TOPIC_RE.test(t)) return true;
  return false;
}

export function detectDutyRateQuestion(text: string): boolean {
  return (
    /\b(exact|what is|how much|tell me|calculate).{0,50}\b(duty|customs duty|tariff|bcd|igst)\b/i.test(
      text
    ) || /\bduty\s+(percentage|percent|%|rate)\b/i.test(text)
  );
}

export function looksLikeNavigationGarbage(text: string): boolean {
  const hits = (text.match(NAV_GARBAGE_RE) || []).length;
  return hits >= 3 || (text.includes("(current)") && text.includes("Industries"));
}

export function buildOutOfScopeReply(): string {
  return (
    "I'm Neo Assist — I help with Neo Logistics services, customs clearance, freight, and shipping questions.\n\n" +
    "That topic is outside what I can help with here. For logistics or customs enquiries, ask me about Neo's CHA services, Cochin/Chennai operations, documentation, or how to ship.\n\n" +
    "You can also reach Neo directly: customercare@neologistics.org (Cochin) or docschennai@neologistics.org (Chennai)."
  );
}

export function buildCannotAnswerReply(): string {
  return (
    "I don't have that in Neo's approved knowledge base yet, so I won't guess.\n\n" +
    "Neo's team can help directly:\n" +
    "• Cochin: customercare@neologistics.org | 0484 2669737\n" +
    "• Chennai: docschennai@neologistics.org | 044 28419747\n\n" +
    "If you share your cargo type and whether this is import/export, I can guide you on what Neo typically handles."
  );
}

export function buildDutyGuidanceReply(): string {
  return (
    "Exact customs duty cannot be stated as a fixed percentage in chat. Duty depends on:\n" +
    "• Precise HS classification\n" +
    "• Transaction value and current CBIC notifications\n" +
    "• Origin (FTA/preferential claims if any)\n" +
    "• IGST and any ADD/CVD where applicable\n\n" +
    "Neo’s licensed CHA team will advise after reviewing your invoice, product specs, and classification. " +
    "Email customercare@neologistics.org (Cochin) or docschennai@neologistics.org (Chennai) with your documents."
  );
}

export function runOutputGuardrails(reply: string, userQuery?: string): {
  ok: boolean;
  sanitized: string;
  flags: string[];
} {
  const flags: string[] = [];
  let sanitized = reply;

  if (looksLikeNavigationGarbage(reply)) {
    flags.push("nav_garbage");
    sanitized =
      "I found related Neo information but the source excerpt wasn't clean enough to quote safely. " +
      buildCannotAnswerReply();
  }

  if (userQuery && detectOutOfScope(userQuery)) {
    flags.push("out_of_scope");
    sanitized = buildOutOfScopeReply();
  }

  if (PRICE_RE.test(reply)) {
    flags.push("price");
    sanitized +=
      "\n\nNote: Neo does not publish rates in chat. Our team will quote after reviewing your shipment details.";
  }
  if (DUTY_PCT_RE.test(reply)) {
    flags.push("duty_percent");
    sanitized = buildDutyGuidanceReply();
  }
  if (TIMELINE_PROMISE_RE.test(reply)) {
    flags.push("timeline_promise");
    sanitized +=
      "\n\nClearance and transit times vary; Neo's operations team will give a realistic working estimate after reviewing documents.";
  }
  if (LEGAL_BINDING_RE.test(reply)) {
    flags.push("legal");
    sanitized +=
      "\n\nThis is general information only, not legal advice. Please consult Neo's specialists for binding guidance.";
  }

  return { ok: flags.length === 0, sanitized, flags };
}

export function parseModelJson(text: string): AiChatResult {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no json");
    const json = JSON.parse(cleaned.slice(start, end + 1)) as Partial<AiChatResult>;
    const lead = normalizeLead(json.lead);
    return {
      reply: String(json.reply ?? cleaned),
      citations: Array.isArray(json.citations) ? json.citations.map(String) : [],
      lead,
      seriousEnquiry: Boolean(json.seriousEnquiry),
      escalate: Boolean(json.escalate),
      needsConsent: Boolean(json.needsConsent),
      cannotAnswerFromKb: Boolean(json.cannotAnswerFromKb),
    };
  } catch {
    if (looksLikeNavigationGarbage(cleaned)) {
      return {
        reply: buildCannotAnswerReply(),
        citations: [],
        seriousEnquiry: false,
        escalate: false,
        needsConsent: false,
        cannotAnswerFromKb: true,
      };
    }
    return {
      reply: cleaned,
      citations: [],
      seriousEnquiry: false,
      escalate: false,
      needsConsent: false,
      cannotAnswerFromKb: false,
    };
  }
}

function normalizeLead(lead: unknown): LeadFields | undefined {
  if (!lead || typeof lead !== "object") return undefined;
  const l = lead as Record<string, unknown>;
  const out: LeadFields = {};
  const keys: (keyof LeadFields)[] = [
    "commodity",
    "volume",
    "origin",
    "destination",
    "timeline",
    "name",
    "company",
    "email",
    "phone",
    "intentType",
  ];
  for (const k of keys) {
    const v = l[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

export function detectHugeEnquiry(text: string, volume?: string): boolean {
  const hay = `${text} ${volume ?? ""}`.toLowerCase();
  const teu = hay.match(/(\d+)\s*(?:\+|plus)?\s*(?:teu|containers?|cntrs?)/i);
  if (teu && Number(teu[1]) >= 20) return true;
  if (/\b(?:project\s+cargo|break\s*bulk|hundreds?\s+of\s+containers|annual\s+contract|rake\s*loads?)\b/i.test(hay)) {
    return true;
  }
  return false;
}

export function extractLeadHints(text: string): LeadFields {
  const out: LeadFields = {};
  const teu = text.match(/(\d+)\s*(?:\+|plus)?\s*(?:teu|containers?|cntrs?)/i);
  if (teu) out.volume = `${teu[1]} TEU`;
  const od = text.match(/\bfrom\s+([^,.]+?)\s+to\s+([^,.]+?)(?:[.!]|$|,|\s+next|\s+by|\s+in)/i);
  if (od) {
    out.origin = od[1]?.trim();
    out.destination = od[2]?.trim();
  }
  const commodity = text.match(
    /\b(?:of|import(?:ing)?|export(?:ing)?)\s+([a-z][a-z\s-]{2,40}?)\s+(?:from|to|into|out of|\d)/i
  );
  if (commodity) out.commodity = commodity[1]?.trim();
  if (/\bnext\s+month\b/i.test(text)) out.timeline = "next month";
  if (/\basap|urgent|immediate\b/i.test(text)) out.timeline = out.timeline ?? "urgent";
  return out;
}

export function mergeLead(
  a: LeadFields | undefined,
  b: LeadFields | undefined
): LeadFields {
  return { ...(a ?? {}), ...(b ?? {}) };
}

export function hasContactPii(lead?: LeadFields): boolean {
  return Boolean(lead?.email || lead?.phone || lead?.name);
}
