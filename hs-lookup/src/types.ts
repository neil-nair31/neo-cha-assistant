export type ExportPolicy = "Free" | "Restricted" | "Prohibited" | "Unknown";

export type HsEntry = {
  /** India CTH / ITC-HS digits only (prefer 8) */
  code: string;
  /** Display form e.g. 0801.32.20 */
  dotted: string;
  section: string;
  chapter: string;
  heading: string;
  /** International HS-6 parent */
  hs6: string;
  description: string;
  headingDescription: string;
  chapterDescription: string;
  /** Indicative DGFT-style export policy from source (verify before filing) */
  exportPolicy: ExportPolicy;
};

export type HsChapter = {
  code: string;
  section: string;
  description: string;
};

export type HsHit = HsEntry & {
  score: number;
  confidence: "high" | "medium" | "low";
};

export type TradeFlow = "import" | "export" | "either";

export type ClassifyRequest = {
  description: string;
  material?: string;
  form?: string;
  endUse?: string;
  originHint?: string;
  /** India customs context */
  tradeFlow?: TradeFlow;
};

export type AmbiguityInfo = {
  ambiguous: boolean;
  /** Do not treat top code as filing-ready */
  requireClarify: boolean;
  reasons: string[];
  message: string;
};

export type CompareLine = {
  code: string;
  dotted: string;
  hs6: string;
  description: string;
  confidence: HsHit["confidence"];
  exportPolicy: ExportPolicy;
  whyItMightFit: string;
  howItDiffers: string;
};

/** Suraj-facing definitive CHA desk recommendation — not a search hit */
export type DeskVerdict = "recommend" | "recommend_with_caveat" | "needs_clarification";

export type RuledOutLine = {
  code: string;
  dotted: string;
  description: string;
  /** Why Neo desk would NOT file this instead of primary */
  because: string;
  /** Only file this line if… */
  onlyIf: string;
};

export type PrimaryRecommendation = {
  code: string;
  dotted: string;
  hs6: string;
  description: string;
  confidence: HsHit["confidence"];
  exportPolicy: ExportPolicy;
  /** Chapter → heading → HS6 → CTH path */
  tariffPath: string;
  /** Plain-English CHA rationale */
  why: string;
  /** What invoice/spec details would change this recommendation */
  whatWouldChange: string[];
  /** Filing-ready? Always false for educational tool; CHA must confirm */
  filingReady: false;
  filingStatus: "educational_pending_cha";
  label: "Neo desk recommendation" | "Neo desk filing precedent";
};

/** When query matches a Neo Cochin/Chennai filing line from their HS workbook */
export type NeoDeskPrecedentInfo = {
  goods: string;
  tradeFlow: "import" | "export";
  ports: string[];
  code: string;
  dotted: string;
  matchScore: number;
};

export type DeskAuthenticity = {
  tier: "neo_desk_precedent" | "neo_desk_ai" | "india_catalog";
  label: string;
  detail: string;
};

export type RelatedNeoCargo = {
  goods: string;
  code: string;
  dotted: string;
  tradeFlow: "import" | "export";
  ports: string[];
  matchScore: number;
};

export type NeoDeskCargoLine = {
  sl: number;
  goods: string;
  code: string;
  dotted: string;
  tradeFlow: "import" | "export";
  ports: string[];
};

/** Practical pack for importers/exporters after a recommendation */
export type ClientActionPack = {
  authenticity: DeskAuthenticity;
  filingDocument: "Bill of Entry" | "Shipping Bill";
  preferredPorts: string[];
  /** Suggested commercial invoice / SB-BoE goods wording */
  invoiceWordingHint: string;
  documentsChecklist: string[];
  nextSteps: string[];
  relatedNeoCargo: RelatedNeoCargo[];
  /** Short text for WhatsApp / email */
  shareText: string;
};

export type ClassifyResult = {
  query: string;
  market: "India";
  disclaimer: string;
  indiaNote: string;
  /** Desk gate: recommend / caveat / needs clarification */
  deskVerdict: DeskVerdict;
  deskVerdictLabel: string;
  /** Definitive top pick for Suraj / desk review */
  primary: PrimaryRecommendation | null;
  /** Present when goods match Neo’s filed HS workbook precedent */
  neoDeskPrecedent: NeoDeskPrecedentInfo | null;
  /** What the client should do next — documents, ports, share text */
  clientPack: ClientActionPack | null;
  /** Close lines that were considered and ruled out (or only-if) */
  ruledOut: RuledOutLine[];
  /** Close alternates only (usually 1–2); full pool kept in candidates */
  alternates: HsHit[];
  candidates: HsHit[];
  /** Side-by-side for top 2–3 lines */
  compare: CompareLine[];
  ambiguity: AmbiguityInfo;
  /** Concrete questions for Neo CHA desk */
  chaQuestions: string[];
  reasoning: string;
  nextQuestions: string[];
  engine: "hybrid-ai" | "lexical" | "neo-desk";
  catalogSize: number;
  dutyNote: string;
};

export type ChaHandoffRequest = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  tradeFlow?: TradeFlow;
  description: string;
  notes?: string;
  candidates: Array<{ code: string; dotted?: string; description: string }>;
  consent: boolean;
};
