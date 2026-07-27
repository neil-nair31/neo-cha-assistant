import type { AiChatResult, KbChunk } from "../types.js";
import {
  buildCannotAnswerReply,
  detectHugeEnquiry,
  extractLeadHints,
} from "./guardrails.js";

export type ClientIntent =
  | "track_shipment"
  | "internal_unknown"
  | "commodity_cashew"
  | "incoterms"
  | "first_time_import"
  | "aeo"
  | "chennai_contact"
  | "cochin_contact"
  | "services_overview"
  | "competitor"
  | "quote_enquiry"
  | "human_escalation"
  | "general";

const HIGH_CONFIDENCE: Set<ClientIntent> = new Set([
  // Hard product gates — must not invent tracking / internal ops / competitor bait
  "track_shipment",
  "internal_unknown",
  "competitor",
  "human_escalation",
]);

export function isHighConfidenceIntent(intent: ClientIntent): boolean {
  return HIGH_CONFIDENCE.has(intent);
}

export function detectTrackingRequest(text: string): boolean {
  return (
    /\b(track|tracking|trace|status of|where is my|locate my)\b/i.test(text) &&
    /\b(container|bl\b|bill of lading|shipment|consignment|vessel|cargo|msk|maeu|hbl)\b/i.test(
      text
    )
  );
}

export function detectInternalUnknown(text: string): boolean {
  return (
    /\b(employee|staff|internal|parking|payroll|salary|leave policy|hr policy|cafeteria|office rules)\b/i.test(
      text
    ) && !/\b(import|export|cargo|customs|clearance|client|customer|ship)\b/i.test(text)
  );
}

export function classifyClientIntent(text: string): ClientIntent {
  const t = text.toLowerCase();

  if (detectTrackingRequest(text)) return "track_shipment";
  if (detectInternalUnknown(text)) return "internal_unknown";
  if (detectHugeEnquiry(text)) return "quote_enquiry";
  if (/\b(cashew|cashews|cashew kernel|cashew kernels)\b/i.test(t)) return "commodity_cashew";
  if (/\b(fob|cif|cip|incoterm|ddp|dap|exw)\b/i.test(t)) return "incoterms";
  if (
    /\b(first.time|first time|new importer|documents?\s+(do i|will i|needed)|importing .{0,40} for the first time)\b/i.test(
      t
    )
  ) {
    return "first_time_import";
  }
  if (/\ba\.?e\.?o\b/i.test(t)) return "aeo";
  if (/\b(chennai office|reach chennai|contact chennai|chennai phone|docschennai)\b/i.test(t)) {
    return "chennai_contact";
  }
  if (/\b(cochin office|kochi office|reach cochin|willingdon|customercare)\b/i.test(t)) {
    return "cochin_contact";
  }
  if (/\b(better than|compare|vs other|versus other|why choose|why neo)\b/i.test(t)) {
    return "competitor";
  }
  if (/\b(human|person|call me|speak to someone|talk to someone|real person)\b/i.test(t)) {
    return "human_escalation";
  }
  if (/\b(what (services|do you offer)|what does neo|services does neo|what do you do)\b/i.test(t)) {
    return "services_overview";
  }
  if (
    /\b(quote|pricing|rates?|how much|clearing|clearance for|imports?|exports?|annual contract|ship(?:ping)?)\b/i.test(
      t
    ) &&
    /\b(container|teu|cargo|ship|textile|steel|machinery|commodity)\b/i.test(t)
  ) {
    return "quote_enquiry";
  }

  return "general";
}

export function buildTrackingReply(): string {
  return (
    "I can't look up live container or shipment status in this chat — that needs Neo's operations team with your BL number, importer name, and filing reference.\n\n" +
    "For an **active shipment**, email:\n" +
    "• Cochin: customercare@neologistics.org | 0484 2669737\n" +
    "• Chennai: docschennai@neologistics.org | 044 28419747\n\n" +
    "Include your BL/container number, company name, and port. Neo's team can update you on customs filing, examination, and out-of-charge status.\n\n" +
    "For a **new shipment**, tell me commodity, volume, origin, and destination — I can guide you on how Neo helps."
  );
}

export function buildCashewReply(): string {
  return (
    "Yes — **cashew and agro exports are a core industry** for Neo Logistics at Cochin.\n\n" +
    "Neo publicly serves clients such as **CFC Cashews (Kollam)** for import/export customs clearance and transportation. Kerala cashew kernels typically need:\n" +
    "• Commercial invoice & packing list\n" +
    "• Shipping bill / BL supporting docs\n" +
    "• Phytosanitary certificate where required\n" +
    "• Grade/moisture specs and FSSAI if food-grade processing applies\n\n" +
    "Share whether you're shipping **bags vs containers**, destination port, and timeline — Neo's CHA team will confirm the exact document list and clearance steps.\n\n" +
    "Cochin: customercare@neologistics.org"
  );
}

export function buildIncotermsReply(): string {
  return (
    "Here's a **general** comparison (not legal advice — confirm with Neo CHA for your contract):\n\n" +
    "**FOB (Free On Board):** Seller delivers goods on board at the origin port. **You (buyer)** typically arrange main ocean freight and **import customs clearance** in India. Common when you control freight but need Neo as CHA at Cochin/Chennai.\n\n" +
    "**CIF (Cost, Insurance & Freight):** Seller pays freight and insurance to the named Indian port. **You still import-clear** in India — duty, IGST, and local charges are usually yours. Neo handles BOE, duty payment coordination, and delivery after out-of-charge.\n\n" +
    "**Which to choose?** Depends on your supplier contract, who controls freight, and risk transfer. For steel imports, many buyers use CIF to the port and engage Neo for clearance + inland haulage.\n\n" +
    "Neo quotes **scoped CHA + logistics** after reviewing your invoice and Incoterm. Email customercare@neologistics.org with your proforma invoice."
  );
}

export function buildFirstTimeImportReply(): string {
  return (
    "Welcome — Neo Logistics can absolutely help with **first-time imports via Cochin** (Licensed CHA since 2007).\n\n" +
    "**Typical steps:**\n" +
    "1. Contact Neo / complete KYC (customercare@neologistics.org)\n" +
    "2. Share **proforma invoice, packing list, BL draft, IEC, GSTIN**\n" +
    "3. Neo CHA reviews HS classification and any PGA needs (FSSAI, BIS, PQ, etc.)\n" +
    "4. Pre-arrival Bill of Entry planning; duty payment after assessment\n" +
    "5. Customs examination if RMS selects; out-of-charge; delivery order; transport/warehouse as contracted\n\n" +
    "**For machinery**, also expect technical literature, weight/dimensions, and any restricted-goods licences if applicable.\n\n" +
    "Share your commodity, origin port, and ETA — Neo's team will walk you through the exact checklist for your shipment."
  );
}

export function buildAeoReply(): string {
  return (
    "Yes — Neo Logistics holds **AEO–LO (Authorized Economic Operator – Logistics Operator)** authorization, along with FFI, MSME, and MTO credentials.\n\n" +
    "**What AEO means (general):** India's AEO programme recognises trusted logistics operators who meet compliance and supply-chain security criteria. Benefits can include faster processing and reduced examination for eligible operators — **applicability to your specific import depends on current CBIC circulars and your importer profile**.\n\n" +
    "Neo can confirm facilitation benefits for your shipment when reviewing documents. Contact customercare@neologistics.org (Cochin) or docschennai@neologistics.org (Chennai)."
  );
}

export function buildChennaiContactReply(): string {
  return (
    "**Neo Logistics — Chennai office**\n\n" +
    "FL1, First Floor, Khaleeli Centre Alsa Mall, Montieth Road, **Egmore, Chennai – 600008**\n\n" +
    "📧 docschennai@neologistics.org\n" +
    "📞 044 28419747, 57, 67\n\n" +
    "Chennai supports CHA, documentation, and logistics for the **Chennai port corridor**. For Cochin/Kerala cargo, use customercare@neologistics.org."
  );
}

export function buildCochinContactReply(): string {
  return (
    "**Neo Logistics — Cochin HQ (Licensed CHA)**\n\n" +
    "Building No. 24/1558, 1st Floor, Handicrafts Building, Gandhi Road, **Willingdon Island, Kochi – 682003**\n\n" +
    "📧 customercare@neologistics.org\n" +
    "📞 0484 2669737, 47, 57\n\n" +
    "Cochin is Neo's main CHA stronghold — customs clearance, freight, warehousing, and multimodal for Kerala and west-coast cargo."
  );
}

export function buildServicesReply(): string {
  return (
    "Neo Logistics is a **Licensed Customs Broker (CHA)** and Neo Group flagship (since 2007), operating from **Cochin (Willingdon Island)** and **Chennai (Egmore)**.\n\n" +
    "**Core services for exporters and importers:**\n" +
    "• Customs brokerage & AEO–LO clearance\n" +
    "• Freight forwarding & multimodal transport (MTO)\n" +
    "• Transportation, warehousing & console agency\n" +
    "• Steamer/vessel agency & stevedoring\n\n" +
    "**Industries:** steel, cement, textiles, chemicals, cashew/agro, marine products, automobiles, and more.\n\n" +
    "Tell me your commodity and route — I'll guide you on next steps or connect you with the team."
  );
}

export function buildCompetitorReply(): string {
  return (
    "I can't compare Neo to other CHAs — but here's what Neo **publicly stands on**:\n\n" +
    "• **Licensed CHA** since 2007, flagship of Neo Group\n" +
    "• **AEO–LO** authorized operator\n" +
    "• **15+ years** serving steel (JSW), chemicals (Solange), cashew (CFC Cashews), white cement, and more\n" +
    "• **24/7 operations** from Cochin Willingdon Island + Chennai Egmore\n" +
    "• End-to-end: clearance, freight, warehousing, transport — not just documentation\n\n" +
    "Client testimonials on neologistics.org highlight transparency, on-time delivery, and integrated service. The best way to judge fit is a trial shipment — email customercare@neologistics.org with your cargo profile."
  );
}

export function buildQuoteEnquiryReply(text: string, huge: boolean): string {
  const hints = extractLeadHints(text);
  const lines = [
    "Thanks — this looks like a **real shipping enquiry**. Neo Logistics (Licensed CHA, Cochin & Chennai) can help with customs clearance, freight coordination, warehousing, and inland transport once the team reviews your documents.",
  ];

  if (huge) {
    lines.push(
      "Because of the volume involved, I'm flagging this as a **priority** for Neo's sales / operations team."
    );
  }

  lines.push(
    "I can't quote rates or exact duty % in chat. To move fast, please share (or confirm):",
    "• Commodity & volume",
    "• Origin & destination port",
    "• Timeline",
    "• Company name + contact email or phone",
    "",
    "Then accept the **consent notice** so Neo can store your details and call back.",
    "",
    "Cochin: customercare@neologistics.org | Chennai: docschennai@neologistics.org"
  );

  if (hints.commodity || hints.volume) {
    lines.unshift(
      `I noted: ${[hints.commodity, hints.volume, hints.origin && hints.destination ? `${hints.origin} → ${hints.destination}` : null].filter(Boolean).join(" · ")}.`
    );
  }

  return lines.join("\n");
}

export function buildHumanEscalationReply(): string {
  return (
    "I'll connect you with Neo's team.\n\n" +
    "Please share your **name, company, email or phone**, and a one-line description of your cargo — then accept the consent notice so Neo can follow up.\n\n" +
    "Or reach them directly:\n" +
    "• Cochin: customercare@neologistics.org | 0484 2669737 (Mon–Sat ~9:30–17:30)\n" +
    "• Chennai: docschennai@neologistics.org | 044 28419747"
  );
}

const CITATIONS: Partial<Record<ClientIntent, string[]>> = {
  commodity_cashew: ["Client Scenario FAQs", "Industry playbooks — Agro"],
  incoterms: ["Incoterms & charge ownership"],
  first_time_import: ["Client Scenario FAQs — First-time importer", "Documentation matrix"],
  aeo: ["Client Scenario FAQs — AEO benefit", "Certifications"],
  chennai_contact: ["Ports & geography — Chennai"],
  cochin_contact: ["Ports & geography — Cochin"],
  services_overview: ["Neo service catalog"],
  competitor: ["Certifications & client references"],
};

export function buildIntentResponse(
  intent: ClientIntent,
  text: string,
  chunks?: KbChunk[]
): AiChatResult | null {
  const huge = detectHugeEnquiry(text);
  let reply: string;
  let seriousEnquiry = false;
  let escalate = false;
  let needsConsent = false;
  let cannotAnswerFromKb = false;

  switch (intent) {
    case "track_shipment":
      reply = buildTrackingReply();
      seriousEnquiry = true;
      break;
    case "internal_unknown":
      reply = buildCannotAnswerReply();
      cannotAnswerFromKb = true;
      break;
    case "commodity_cashew":
      reply = buildCashewReply();
      seriousEnquiry = /\b(export|import|ship|quote|help)\b/i.test(text);
      needsConsent = seriousEnquiry;
      break;
    case "incoterms":
      reply = buildIncotermsReply();
      break;
    case "first_time_import":
      reply = buildFirstTimeImportReply();
      seriousEnquiry = true;
      break;
    case "aeo":
      reply = buildAeoReply();
      break;
    case "chennai_contact":
      reply = buildChennaiContactReply();
      break;
    case "cochin_contact":
      reply = buildCochinContactReply();
      break;
    case "services_overview":
      reply = buildServicesReply();
      break;
    case "competitor":
      reply = buildCompetitorReply();
      break;
    case "quote_enquiry":
      reply = buildQuoteEnquiryReply(text, huge);
      seriousEnquiry = true;
      escalate = huge;
      needsConsent = true;
      break;
    case "human_escalation":
      reply = buildHumanEscalationReply();
      seriousEnquiry = true;
      needsConsent = true;
      break;
    case "general":
      return null;
  }

  const citations =
    CITATIONS[intent] ??
    (chunks?.length ? chunks.slice(0, 3).map((c) => c.title) : []);

  return {
    reply,
    citations,
    seriousEnquiry,
    escalate,
    needsConsent,
    cannotAnswerFromKb,
    lead: {
      intentType:
        intent === "quote_enquiry"
          ? huge
            ? "huge_enquiry"
            : "quote"
          : intent === "track_shipment"
            ? "track"
            : seriousEnquiry
              ? "enquiry"
              : "general",
      ...extractLeadHints(text),
    },
  };
}
