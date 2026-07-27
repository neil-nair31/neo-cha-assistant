export type NotificationSource = "cbic" | "dgft" | "neo" | "other";

export type NeoIndustry =
  | "cashew"
  | "steel"
  | "chemicals"
  | "automobiles"
  | "mining"
  | "textiles"
  | "agro"
  | "seafood"
  | "cement"
  | "sanitary-wares"
  | "industrial-raw-materials"
  | "general-trade";

export type PostStatus = "draft" | "published" | "rejected";

export type RawNotice = {
  id: string;
  source: NotificationSource;
  noticeNo: string;
  title: string;
  publishedAt: string;
  sourceUrl: string;
  rawSubject: string;
  /** Scraper channel id for health reporting */
  channel: string;
  /** Optional fetched page text for richer AI posts */
  bodyText?: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  impact: string;
  industries: NeoIndustry[];
  tags: string[];
  source: NotificationSource;
  noticeNo: string;
  publishedAt: string;
  sourceUrl: string;
  generatedAt: string;
  status: PostStatus;
  /** ai | fallback */
  engine: "ai" | "fallback";
  qualityScore: number;
  reviewedAt?: string;
  reviewedBy?: string;
  channel?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  summary: string;
  impact: string;
  tags: string[];
  source: NotificationSource;
  publishedAt: string;
  sourceUrl: string;
};

export type Subscriber = {
  id: string;
  email: string;
  name?: string;
  company?: string;
  topics: string[];
  consentAt: string;
  active: boolean;
  createdAt: string;
};

export type SourceHealth = {
  channel: string;
  source: NotificationSource;
  ok: boolean;
  count: number;
  error?: string;
  latencyMs: number;
};
