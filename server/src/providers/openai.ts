import OpenAI from "openai";
import { config } from "../config.js";
import type { AiProvider, ChatMessage } from "../types.js";
import { KbFallbackProvider } from "./kbFallback.js";

export class OpenAiProvider implements AiProvider {
  name = "openai";

  async chat(input: {
    system: string;
    messages: ChatMessage[];
    model?: string;
  }): Promise<{ text: string; raw?: unknown }> {
    if (!config.openaiApiKey || config.openaiApiKey.includes("your-key")) {
      return new KbFallbackProvider().chat(input);
    }

    const client = new OpenAI({
      apiKey: config.openaiApiKey,
      ...(config.openaiBaseUrl
        ? {
            baseURL: config.openaiBaseUrl,
            defaultHeaders: {
              "HTTP-Referer": "https://www.neologistics.org",
              "X-Title": "Neo Logistics Neo Assist",
            },
          }
        : {}),
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: input.system },
      ...input.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];

    const model = input.model || config.aiModel;

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 1400,
        temperature: 0.25,
        response_format: { type: "json_object" },
      });

      const text = response.choices[0]?.message?.content?.trim() ?? "";
      if (!text) {
        return new KbFallbackProvider().chat(input);
      }

      return { text, raw: response };
    } catch (err) {
      console.error("[openai] API failed, using knowledge-base fallback", err);
      return new KbFallbackProvider().chat(input);
    }
  }
}
