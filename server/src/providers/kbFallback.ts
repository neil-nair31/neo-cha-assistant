import type { AiProvider, ChatMessage } from "../types.js";
import {
  buildCannotAnswerReply,
  buildDutyGuidanceReply,
  buildOutOfScopeReply,
  detectDutyRateQuestion,
  detectOutOfScope,
  looksLikeNavigationGarbage,
} from "../assistant/guardrails.js";
import {
  buildIntentResponse,
  classifyClientIntent,
  isHighConfidenceIntent,
} from "../assistant/intents.js";
import { retrieveRelevantChunksWithScores } from "../rag/retrieve.js";

/**
 * Deterministic KB-grounded fallback when the AI provider is missing or fails.
 */
export class KbFallbackProvider implements AiProvider {
  name = "kb-fallback";

  async chat(input: {
    system: string;
    messages: ChatMessage[];
    model?: string;
  }): Promise<{ text: string }> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const q = lastUser?.content ?? "";

    if (detectOutOfScope(q)) {
      return this.wrap(buildOutOfScopeReply(), [], { cannotAnswerFromKb: true });
    }

    if (detectDutyRateQuestion(q)) {
      return this.wrap(buildDutyGuidanceReply(), []);
    }

    const retrieval = await retrieveRelevantChunksWithScores(q, 5);
    const intent = classifyClientIntent(q);
    const intentResult = buildIntentResponse(intent, q, retrieval.chunks);

    if (intentResult && isHighConfidenceIntent(intent)) {
      return this.wrap(intentResult.reply, intentResult.citations, {
        seriousEnquiry: intentResult.seriousEnquiry,
        escalate: intentResult.escalate,
        needsConsent: intentResult.needsConsent,
        cannotAnswerFromKb: intentResult.cannotAnswerFromKb,
        lead: intentResult.lead,
      });
    }

    if (!retrieval.sufficient || !retrieval.chunks.length) {
      return this.wrap(buildCannotAnswerReply(), [], {
        cannotAnswerFromKb: true,
        seriousEnquiry: /\b(quote|ship|import|export)\b/i.test(q),
        needsConsent: /\b(quote|ship|import|export)\b/i.test(q),
      });
    }

    const top = retrieval.chunks[0]!;
    if (looksLikeNavigationGarbage(top.content)) {
      return this.wrap(buildCannotAnswerReply(), [], { cannotAnswerFromKb: true });
    }

    const summary = summarize(top.content, 480);
    const reply = `${summary}\n\nFor specifics on your shipment, email customercare@neologistics.org (Cochin) or docschennai@neologistics.org (Chennai). I won't quote prices or exact duty % in chat.`;

    return this.wrap(reply, retrieval.chunks.slice(0, 3).map((c) => c.title), {
      seriousEnquiry: /\b(quote|ship|import|export|enquiry)\b/i.test(q),
      needsConsent: /\b(quote|ship|import|export)\b/i.test(q),
    });
  }

  private wrap(
    reply: string,
    citations: string[],
    extra: {
      seriousEnquiry?: boolean;
      escalate?: boolean;
      needsConsent?: boolean;
      cannotAnswerFromKb?: boolean;
      lead?: Record<string, string | undefined>;
    } = {}
  ) {
    return {
      text: JSON.stringify({
        reply,
        citations,
        seriousEnquiry: extra.seriousEnquiry ?? false,
        escalate: extra.escalate ?? false,
        needsConsent: extra.needsConsent ?? false,
        cannotAnswerFromKb: extra.cannotAnswerFromKb ?? false,
        lead: extra.lead,
      }),
    };
  }
}

function summarize(text: string, max = 320): string {
  const flat = text.replace(/[#*`]/g, "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}
