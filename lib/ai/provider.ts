/**
 * AI provider abstraction — supports Gemini (free) and Anthropic (paid).
 *
 * Selection priority:
 *   1. GEMINI_API_KEY → Gemini (cheaper / free tier)
 *   2. ANTHROPIC_API_KEY → Anthropic
 *   3. neither → null → routes return stub
 *
 * The two AI vendors expose different APIs; this module hides the difference
 * behind a single `generate()` call that takes a system prompt, user prompt,
 * and a max output budget.
 */

import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

export type AITier = "fast" | "quality";

export interface AIGenerateOpts {
  system: string;
  user: string;
  maxOutputTokens: number;
  /** Hint for strict-JSON-only outputs. Some providers can be told. */
  responseMimeType?: "text/plain" | "application/json";
}

export interface AIGenerateResult {
  text: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  vendor: "gemini" | "anthropic";
}

export interface AIProvider {
  vendor: "gemini" | "anthropic";
  modelName: string;
  generate(opts: AIGenerateOpts): Promise<AIGenerateResult>;
}

const GEMINI_MODELS: Record<AITier, string> = {
  fast: "gemini-2.5-flash",
  quality: "gemini-2.5-pro",
};

const ANTHROPIC_MODELS: Record<AITier, string> = {
  fast: "claude-haiku-4-5",
  quality: "claude-sonnet-4-6",
};

let geminiClient: GoogleGenAI | null = null;
let anthropicClient: Anthropic | null = null;

function gemini(tier: AITier): AIProvider {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  const modelName = GEMINI_MODELS[tier];
  return {
    vendor: "gemini",
    modelName,
    async generate(opts) {
      const res = await geminiClient!.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: opts.user }] }],
        config: {
          systemInstruction: opts.system,
          maxOutputTokens: opts.maxOutputTokens,
          ...(opts.responseMimeType
            ? { responseMimeType: opts.responseMimeType }
            : {}),
        },
      });
      const text = res.text ?? "";
      const usage = res.usageMetadata;
      return {
        text,
        model: modelName,
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        vendor: "gemini",
      };
    },
  };
}

function anthropic(tier: AITier): AIProvider {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  const modelName = ANTHROPIC_MODELS[tier];
  return {
    vendor: "anthropic",
    modelName,
    async generate(opts) {
      const res = await anthropicClient!.messages.create({
        model: modelName,
        max_tokens: opts.maxOutputTokens,
        system: [
          { type: "text", text: opts.system, cache_control: { type: "ephemeral" } },
        ],
        messages: [{ role: "user", content: opts.user }],
      });
      const text = res.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("\n");
      return {
        text,
        model: res.model,
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
        vendor: "anthropic",
      };
    },
  };
}

export function getAIProvider(tier: AITier): AIProvider | null {
  if (process.env.GEMINI_API_KEY) return gemini(tier);
  if (process.env.ANTHROPIC_API_KEY) return anthropic(tier);
  return null;
}

/** Report which vendor is active without exposing keys. Useful for /api/health. */
export function aiVendorActive(): "gemini" | "anthropic" | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}
