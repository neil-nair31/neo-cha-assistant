import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function defaultAiModel(provider: string): string {
  if (provider === "anthropic") return "claude-sonnet-4-20250514";
  if (provider === "openai") return "openai/gpt-4o-mini";
  return "gemini-2.0-flash";
}

const aiProvider = (process.env.AI_PROVIDER ?? "gemini") as
  | "gemini"
  | "google"
  | "openai"
  | "anthropic";

export const config = {
  port: num(process.env.PORT, 8787),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5174,http://localhost:8787",

  aiProvider,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  /** OpenRouter: https://openrouter.ai/api/v1 — leave empty for api.openai.com */
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY ?? "",
  aiModel: process.env.AI_MODEL ?? defaultAiModel(aiProvider),
  /** Stronger model for serious cargo / quote / escalate turns */
  aiModelPremium:
    process.env.AI_MODEL_PREMIUM ??
    (aiProvider === "openai" ? "openai/gpt-4o" : process.env.AI_MODEL ?? defaultAiModel(aiProvider)),
  hsAiModel: process.env.HS_AI_MODEL ?? "",

  voyageApiKey: process.env.VOYAGE_API_KEY ?? "",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "voyage-3",
  rerankModel: process.env.RERANK_MODEL ?? "rerank-2",

  databasePath:
    process.env.DATABASE_PATH ??
    path.resolve(__dirname, "../../data/neo-assistant.sqlite"),
  databaseUrl: process.env.DATABASE_URL ?? "",

  notifyChannels: (process.env.NOTIFY_CHANNELS ?? "email")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  leadNotifyEmail: process.env.LEAD_NOTIFY_EMAIL ?? "customercare@neologistics.org",
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
  googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL ?? "",

  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "Neo Logistics Assistant <noreply@neologistics.org>",
  },

  retentionMonths: num(process.env.DATA_RETENTION_MONTHS, 12),
  privacyPolicyUrl:
    process.env.PRIVACY_POLICY_URL ?? "https://www.neologistics.org/contact-us/",
  dataDeletionEmail: process.env.DATA_DELETION_EMAIL ?? "customercare@neologistics.org",

  rateLimitWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 600_000),
  rateLimitMax: num(process.env.RATE_LIMIT_MAX, 30),
  hugeEnquiryTeu: num(process.env.HUGE_ENQUIRY_TEU, 20),
  hugeEnquiryNotify: (process.env.HUGE_ENQUIRY_NOTIFY ?? "true") === "true",

  allowedLanguages: (process.env.ALLOWED_LANGUAGES ?? "en")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  defaultLanguage: process.env.DEFAULT_LANGUAGE ?? "en",

  knowledgeDir: path.resolve(__dirname, "../../knowledge"),
  widgetDir: path.resolve(__dirname, "../../widget/dist"),
};
