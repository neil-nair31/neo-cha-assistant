import type { AiProvider } from "../types.js";
import { config } from "../config.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAiProvider } from "./openai.js";

export function getAiProvider(): AiProvider {
  switch (config.aiProvider) {
    case "gemini":
    case "google":
      return new GeminiProvider();
    case "openai":
      return new OpenAiProvider();
    case "anthropic":
      return new AnthropicProvider();
    default:
      return new GeminiProvider();
  }
}
