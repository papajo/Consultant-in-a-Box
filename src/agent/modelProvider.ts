import { GoogleGenAI } from '@google/genai';

/**
 * Model Provider Abstraction Interface
 * Keeps the agentic pipeline agnostic to the underlying LLM provider
 * (Supports Google Gemini SDK as primary, and can be extended to OpenAI / local endpoints like Qwen).
 */
export interface LLMProvider {
  name: string;
  generateJSON<T>(prompt: string, systemInstruction?: string, options?: { temperature?: number }): Promise<T>;
  generateTextWithGrounding(prompt: string, systemInstruction?: string): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }>;
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
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

export const defaultModelProvider = new GeminiProvider();
