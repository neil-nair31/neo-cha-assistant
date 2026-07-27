export type KbChunk = {
  id: string;
  docId: string;
  section: string;
  title: string;
  source?: string;
  content: string;
  tokens: number;
  embedding?: number[];
};

export type RetrievalResult = {
  chunks: KbChunk[];
  topScore: number;
  sufficient: boolean;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LeadFields = {
  commodity?: string;
  volume?: string;
  origin?: string;
  destination?: string;
  timeline?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  intentType?: string;
};

export type AiChatResult = {
  reply: string;
  citations: string[];
  lead?: LeadFields;
  seriousEnquiry: boolean;
  escalate: boolean;
  needsConsent: boolean;
  cannotAnswerFromKb: boolean;
};

export interface AiProvider {
  name: string;
  chat(input: {
    system: string;
    messages: ChatMessage[];
    /** Optional model override (e.g. gpt-4o for serious enquiries) */
    model?: string;
  }): Promise<{ text: string; raw?: unknown }>;
}
