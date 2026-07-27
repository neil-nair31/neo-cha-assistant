import { config } from "../config.js";
import type { AiProvider, ChatMessage } from "../types.js";
import { KbFallbackProvider } from "./kbFallback.js";

export class AnthropicProvider implements AiProvider {
  name = "anthropic";

  async chat(input: {
    system: string;
    messages: ChatMessage[];
    model?: string;
  }): Promise<{ text: string; raw?: unknown }> {
    if (!config.anthropicApiKey || config.anthropicApiKey.includes("your-key")) {
      return new KbFallbackProvider().chat(input);
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const messages = input.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const response = await client.messages.create({
      model: input.model || config.aiModel,
      max_tokens: 1200,
      temperature: 0.2,
      system: input.system,
      messages,
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? b.text : ""))
      .join("\n")
      .trim();

    return { text, raw: response };
  }
}
