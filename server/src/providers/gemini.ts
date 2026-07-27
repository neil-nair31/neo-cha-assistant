import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { config } from "../config.js";
import type { AiProvider, ChatMessage } from "../types.js";
import { parseModelJson } from "../assistant/guardrails.js";
import { KbFallbackProvider } from "./kbFallback.js";

export class GeminiProvider implements AiProvider {
  name = "gemini";

  async chat(input: {
    system: string;
    messages: ChatMessage[];
    model?: string;
  }): Promise<{ text: string; raw?: unknown }> {
    const key = config.geminiApiKey || config.googleAiApiKey;

    if (!key || key.includes("your-key")) {
      console.warn("[gemini] No API key — using KB fallback");
      return new KbFallbackProvider().chat(input);
    }

    const turns = input.messages.filter((m) => m.role === "user" || m.role === "assistant");
    if (!turns.length || turns[turns.length - 1]?.role !== "user") {
      return new KbFallbackProvider().chat(input);
    }

    const genAI = new GoogleGenerativeAI(key);
    const models = [
      ...new Set([config.aiModel, "gemini-2.0-flash", "gemini-1.5-flash"].filter(Boolean)),
    ];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: input.system,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        });

        const history: Content[] = turns.slice(0, -1).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const last = turns[turns.length - 1]!;
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(last.content);
        const text = result.response.text()?.trim() ?? "";

        if (text) {
          const parsed = parseModelJson(text);
          if (parsed.reply.length > 15) {
            return { text, raw: result };
          }
        }

        console.warn(`[gemini] ${modelName} returned empty or short response`);
      } catch (err) {
        console.error(`[gemini] ${modelName} failed`, err);
      }
    }

    console.warn("[gemini] All models failed — using KB fallback");
    return new KbFallbackProvider().chat(input);
  }
}
