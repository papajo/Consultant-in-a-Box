import type { IncomingMessage, ServerResponse } from 'node:http';

// Dependency-free liveness check (helps tell platform issues from app issues).
export default function ping(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, node: process.version, groqKeyConfigured: !!process.env.GROQ_API_KEY }));
}
