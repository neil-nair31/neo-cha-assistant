/**
 * OpenAI-compatible chat (OpenRouter or api.openai.com).
 * Used when OPENAI_API_KEY is set; OpenRouter needs OPENAI_BASE_URL.
 */
export async function openAiChat(opts: {
  system?: string;
  user: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
}): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY ?? "";
  if (!key || key.includes("your-key") || key.includes("PASTE_")) return null;

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const body: Record<string, unknown> = {
    model: opts.model,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1400,
    messages: [
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: opts.user },
    ],
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://www.neologistics.org",
      "X-Title": "Neo Logistics Customs Digest",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI/OpenRouter ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}
