# CLAUDE.md — Consultant-in-a-Box

## Stack
- TypeScript, React 19 + Vite, Express (`server.ts`, Vite middleware in dev)
- LLM: `src/agent/modelProvider.ts` — `FallbackProvider` = Gemini (`@google/genai`) → Groq (`src/agent/groqClient.ts`)
- Docs parsing: pdf.js / pdf-parse / mammoth; image OCR Gemini → Groq vision (`src/agent/documentParser.ts`)
- Orchestrator: `src/agent/orchestrator.ts` (deterministic fallbacks when the LLM fails)

## Commands
```
npm install
npm run dev              # tsx server.ts
npm run lint             # tsc --noEmit
npm test                 # benchmark suite (3 of 4 currently fail without an API key — pre-existing)
npm run test:fallback    # Groq fallback tests, no network
npm run build && npm start
```

## Conventions
- Env: GEMINI_API_KEY (primary), GROQ_API_KEY / GROQ_MODEL / GROQ_VISION_MODEL (fallback).
- New LLM calls go through `LLMProvider`, never a raw SDK client, so the fallback applies.
- Groq has no search grounding: research results return `sources: []`.
