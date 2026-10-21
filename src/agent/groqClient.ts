/**
 * Minimal Groq client (OpenAI-compatible Chat Completions API).
 * Used as a fallback when Gemini is not configured, rate-limited or unavailable.
 *
 * Env:
 *   GROQ_API_KEY        required to enable the fallback
 *   GROQ_MODEL          text model (default: llama-3.3-70b-versatile)
 *   GROQ_VISION_MODEL   image-capable model (default: meta-llama/llama-4-scout-17b-16e-instruct)
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GroqContent =
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: GroqContent;
}

export interface GroqOptions {
  json?: boolean;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export function groqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export function groqTextModel(): string {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

export function groqVisionModel(): string {
  return process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
}

export async function groqChat(messages: GroqMessage[], opts: GroqOptions = {}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured on the server.');
  const fetchFn = opts.fetchFn ?? fetch;

  // Groq JSON mode requires the word "json" to appear in the messages.
  const msgs: GroqMessage[] = opts.json
    ? [{ role: 'system', content: 'Respond with a single valid JSON object only.' }, ...messages]
    : messages;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 30000);
  try {
    const res = await fetchFn(GROQ_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: opts.model || groqTextModel(),
        messages: msgs,
        temperature: opts.temperature ?? 0.2,
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`Groq API ${res.status}: ${detail}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timer);
  }
}

export function parseJSONLoose<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
