import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Lazy client — reads GEMINI_API_KEY after dotenv.config() has run ──────────
// DO NOT initialize at module level: imports run before dotenv.config() in index.ts
// so process.env.GEMINI_API_KEY would be undefined at startup.

let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getModel() {
  if (_model) return _model;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes('your_')) {
    throw new Error('GEMINI_API_KEY is not set. Add it to backend/.env and restart the server.');
  }
  const genAI = new GoogleGenerativeAI(key);
  _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return _model;
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

export const GEMINI_MODEL = 'gemini-2.5-flash';
