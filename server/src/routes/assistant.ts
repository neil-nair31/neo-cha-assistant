import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import {
  handleChat,
  recordConsent,
  requestDeletion,
  getOrCreateConversation,
} from "../assistant/service.js";
import { consentNoticeText, CONSENT_VERSION, strings } from "../assistant/prompts.js";
import { getAllChunks } from "../rag/retrieve.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: strings.en.rateLimited },
});

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "neo-cha-assistant",
    kbChunks: getAllChunks().length,
    languages: config.allowedLanguages,
    aiProvider: config.aiProvider,
    aiModel: config.aiModel,
    aiKeyConfigured: Boolean(
      (config.aiProvider === "gemini" || config.aiProvider === "google") &&
        (config.geminiApiKey || config.googleAiApiKey) &&
        !(config.geminiApiKey + config.googleAiApiKey).includes("your-key")
    ) ||
      (config.aiProvider === "openai" &&
        config.openaiApiKey &&
        !config.openaiApiKey.includes("your-key")) ||
      (config.aiProvider === "anthropic" &&
        config.anthropicApiKey &&
        !config.anthropicApiKey.includes("your-key")),
  });
});

router.get("/config", (_req, res) => {
  res.json({
    languages: config.allowedLanguages,
    defaultLanguage: config.defaultLanguage,
    privacyPolicyUrl: config.privacyPolicyUrl,
    consentVersion: CONSENT_VERSION,
    consentText: consentNoticeText(),
    welcome: strings.en.welcome,
    brand: {
      name: "Neo Assist",
      company: "Neo Logistics",
      primary: "#303392",
      accent: "#c8102e",
    },
  });
});

router.post("/chat", chatLimiter, async (req, res) => {
  const schema = z.object({
    message: z.string().min(1).max(4000),
    conversationId: z.string().optional(),
    sessionId: z.string().min(8).max(128),
    language: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await handleChat({
      ...parsed.data,
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "assistant_unavailable",
      reply: strings.en.fallback,
    });
  }
});

router.post("/consent", (req, res) => {
  const schema = z.object({
    conversationId: z.string().min(1),
    accepted: z.literal(true),
    sessionId: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Consent must be explicitly accepted" });
    return;
  }

  getOrCreateConversation({
    conversationId: parsed.data.conversationId,
    sessionId: parsed.data.sessionId,
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });

  const result = recordConsent({
    conversationId: parsed.data.conversationId,
    ip: req.ip,
  });
  res.json({ ok: true, ...result });
});

router.post("/deletion-request", (req, res) => {
  const schema = z.object({
    email: z.string().email().optional(),
    phone: z.string().min(6).max(32).optional(),
    conversationId: z.string().optional(),
    reason: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || (!parsed.data.email && !parsed.data.phone && !parsed.data.conversationId)) {
    res.status(400).json({ error: "Provide email, phone, or conversationId" });
    return;
  }
  const result = requestDeletion(parsed.data);
  res.json({
    ok: true,
    ...result,
    message: `Deletion request received. Neo will process it via ${config.dataDeletionEmail}.`,
  });
});

export default router;
