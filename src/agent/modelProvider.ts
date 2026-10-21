import { GoogleGenAI } from '@google/genai';
import { groqChat, groqConfigured, parseJSONLoose } from './groqClient.ts';

/**
 * Model Provider Abstraction Interface
 * Keeps the agentic pipeline agnostic to the underlying LLM provider
 * (Supports Google Gemini SDK as primary, and can be extended to OpenAI / local endpoints like Qwen).
 */
export interface LLMProvider {
  name: string;
  generateJSON<T>(prompt: string, systemInstruction?: string, options?: { temperature?: number }): Promise<T>;
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
  generateTextWithGrounding(prompt: string, systemInstruction?: string): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }>;
}

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[ModelProvider] GEMINI_API_KEY is not set. Will use deterministic evaluator fallback if needed.');
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export class GeminiProvider implements LLMProvider {
  name = 'Google Gemini 3.7 Flash';
  private modelName = 'gemini-3.7-flash';

  async generateJSON<T>(prompt: string, systemInstruction?: string, options?: { temperature?: number }): Promise<T> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an expert AI consulting evaluator agent. Always return valid JSON adhering strictly to instructions.',
        responseMimeType: 'application/json',
        temperature: options?.temperature ?? 0.2,
      },
    });

    const text = response.text || '{}';
    try {
      return JSON.parse(text) as T;
    } catch (err) {
      console.error('[GeminiProvider] Failed to parse JSON response:', text, err);
      // Clean potential markdown wrappers
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as T;
    }
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const response = await client.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || 'You are an elite enterprise consulting strategist and advisor.',
        temperature: 0.3,
      },
    });

    return response.text || '';
  }

  async generateTextWithGrounding(prompt: string, systemInstruction?: string): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    try {
      const response = await client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are a research agent investigating corporate clients, technology ecosystems, and market risks for a senior consultant.',
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || 'No research output produced.';
      const sources: Array<{ title: string; uri: string }> = [];

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }

      return { text, sources };
    } catch (error) {
      console.warn('[GeminiProvider] Search grounding encountered error, falling back to standard generation:', error);
      // Fallback to standard content generation without search tool if grounding fails
      const fallback = await client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || 'You are a research agent investigating corporate clients and consulting opportunities.',
        },
      });
      return {
        text: fallback.text || 'Client research generated using model knowledge base.',
        sources: [],
      };
    }
  }
}

/**
 * Groq provider (OpenAI-compatible). No web-search grounding: research falls
 * back to model knowledge and returns no sources.
 */
export class GroqProvider implements LLMProvider {
  name = 'Groq';

  async generateJSON<T>(prompt: string, systemInstruction?: string, options?: { temperature?: number }): Promise<T> {
    const text = await groqChat(
      [
        { role: 'system', content: systemInstruction || 'You are an expert AI consulting evaluator agent. Always return valid JSON adhering strictly to instructions.' },
        { role: 'user', content: prompt },
      ],
      { json: true, temperature: options?.temperature ?? 0.2 },
    );
    return parseJSONLoose<T>(text || '{}');
  }

  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    return groqChat(
      [
        { role: 'system', content: systemInstruction || 'You are an elite enterprise consulting strategist and advisor.' },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.3 },
    );
  }

  async generateTextWithGrounding(prompt: string, systemInstruction?: string) {
    const text = await this.generateText(
      prompt,
      systemInstruction || 'You are a research agent investigating corporate clients and consulting opportunities. You have no live web access; say so where facts may be out of date.',
    );
    return { text: text || 'Client research generated using model knowledge base.', sources: [] };
  }
}

/**
 * Tries Gemini first; on missing key, rate limit (429), overload (503) or any
 * other error, retries the same call on Groq when GROQ_API_KEY is set.
 */
export class FallbackProvider implements LLMProvider {
  constructor(
    private primary: LLMProvider = new GeminiProvider(),
    private secondary: LLMProvider = new GroqProvider(),
    private secondaryEnabled: () => boolean = groqConfigured,
  ) {}

  lastUsed = '';

  get name() {
    return this.lastUsed || this.primary.name;
  }

  private async run<R>(label: string, call: (p: LLMProvider) => Promise<R>): Promise<R> {
    try {
      const r = await call(this.primary);
      this.lastUsed = this.primary.name;
      return r;
    } catch (err: any) {
      if (!this.secondaryEnabled()) throw err;
      console.warn(`[ModelProvider] ${this.primary.name} failed on ${label} (${err?.status || err?.message}); falling back to ${this.secondary.name}`);
      const r = await call(this.secondary);
      this.lastUsed = this.secondary.name;
      return r;
    }
  }

  generateJSON<T>(prompt: string, systemInstruction?: string, options?: { temperature?: number }) {
    return this.run('generateJSON', p => p.generateJSON<T>(prompt, systemInstruction, options));
  }

  generateText(prompt: string, systemInstruction?: string) {
    return this.run('generateText', p => p.generateText(prompt, systemInstruction));
  }

  generateTextWithGrounding(prompt: string, systemInstruction?: string) {
    return this.run('generateTextWithGrounding', p => p.generateTextWithGrounding(prompt, systemInstruction));
  }
}

export const defaultModelProvider = new FallbackProvider();
