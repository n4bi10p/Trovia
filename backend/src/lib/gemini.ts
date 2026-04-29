import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── Core ask function ─────────────────────────────────────────────────────────

export async function ask(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
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

export const GEMINI_MODEL = 'gemini-2.5-flash';
