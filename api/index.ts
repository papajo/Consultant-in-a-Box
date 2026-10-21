import type { IncomingMessage, ServerResponse } from 'node:http';

// Vercel Node function: every /api/* request is rewritten here (see vercel.json).
// The app is loaded lazily so a startup failure returns a readable error
// instead of an opaque FUNCTION_INVOCATION_FAILED.
let appPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    appPromise ??= import('../src/server/app.ts').then((m) => m.createApp() as any);
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    appPromise = undefined;
    console.error('[api] startup failure', err);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'startup_failure', message: String(err?.message || err), stack: String(err?.stack || '').split('\n').slice(0, 6) }));
  }
}
