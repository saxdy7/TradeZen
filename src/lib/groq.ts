// Server-only — Groq SDK client
import Groq from 'groq-sdk';

// Re-export personas for server-side usage (API routes)
export { AI_PERSONAS, SYSTEM_PROMPT, BASE_RULES } from './ai-personas';
export type { AIPersona } from './ai-personas';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

