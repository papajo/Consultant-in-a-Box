# CLAUDE.md — Consultant-in-a-Box

## Stack
- TypeScript, React 19 + Vite. API routes in `src/server/app.ts` (`createApp()`); `server.ts` = local dev/node host; `api/index.ts` = Vercel function (see `vercel.json`)
- LLM: `src/agent/modelProvider.ts` — `FallbackProvider` = Gemini (`@google/genai`) → Groq (`src/agent/groqClient.ts`)
- Docs parsing: pdfjs-dist (server: legacy build, lazy-loaded with DOMMatrix stand-in + worker import) / mammoth; image OCR Gemini → Groq vision (`src/agent/documentParser.ts`)
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
- Relative imports use `.ts` extensions; `rewriteRelativeImportExtensions` in tsconfig makes Vercel's compile emit `.js`. Don't remove it.
- Verify deploy builds locally: `vercel build`, then COPY `.vercel/output/functions/api/index.func` OUTSIDE the repo and run `api/index.js` there (inside the repo Node silently resolves the project's node_modules and hides missing deps).
- pdf.js is loaded lazily with a DOMMatrix stand-in (`documentParser.ts`); don't import it statically — its native canvas polyfill isn't traced by Vercel.
- Rate limits: `src/server/rateLimit.ts` (in-memory, per instance).
