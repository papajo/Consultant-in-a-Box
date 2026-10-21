# Consultant-in-a-Box

**Multi-agent RFP triage and an evidence-backed decision engine, powered by Gemini.**

Small consultancies and agencies lose hours reading long RFP documents and still make go / no-go decisions on gut feel. Consultant-in-a-Box parses bid documents in the browser and has specialist AI agents for requirements extraction, evidence fit analysis, risk review, and proposal drafting.

![Consultant-in-a-Box RFP triage demo](assets/consultant-in-a-box-rfp-triage.svg)


### Tech stack
TypeScript · React 19 · Vite · Express (`server.ts`) · Google Gemini (`@google/genai`) · PDF and DOCX parsing (pdf.js, pdf-parse, mammoth)

### Run it locally
```bash
npm install
cp .env.example .env    # set GEMINI_API_KEY
npm run dev             # starts server.ts with Vite middleware
npm test                # benchmark tests (tests/benchmarkTests.ts)
```
Production build: `npm run build && npm start`.

### Status
A working prototype, actively developed. Started from Google AI Studio tooling, then extended.

### License
MIT — see [LICENSE](LICENSE).
