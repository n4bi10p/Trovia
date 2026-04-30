import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

let cachedModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel() {
  if (cachedModel) return cachedModel;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_gemini_api_key_here')) {
    throw new Error('GEMINI_API_KEY env var is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  return cachedModel;
}

// ── Core ask function ─────────────────────────────────────────────────────────

export async function ask(prompt: string): Promise<string> {
  const result = await getModel().generateContent(prompt);
  return result.response.text();
}

// ── JSON ask (for structured outputs like content reply) ──────────────────────

export async function askJSON<T>(prompt: string): Promise<T> {
  const raw = await ask(prompt);
  // Strip markdown code fences if Gemini wraps JSON in ```json ... ```
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── Agent-specific prompt builders ───────────────────────────────────────────
// BHUMI: Fill these prompts in your agent files, not here.
// This file is a clean wrapper. Keep it that way.
