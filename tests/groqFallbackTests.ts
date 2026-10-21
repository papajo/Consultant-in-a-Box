/**
 * Tests for the Gemini → Groq fallback. No network: Groq fetch is mocked.
 * Run: npx tsx tests/groqFallbackTests.ts
 */
import assert from 'node:assert/strict';
import { FallbackProvider, type LLMProvider } from '../src/agent/modelProvider.ts';
import { groqChat } from '../src/agent/groqClient.ts';

const failing = (status: number): LLMProvider => ({
  name: 'Gemini',
  async generateJSON() { throw Object.assign(new Error(`HTTP ${status}`), { status }); },
  async generateText() { throw Object.assign(new Error(`HTTP ${status}`), { status }); },
  async generateTextWithGrounding() { throw Object.assign(new Error(`HTTP ${status}`), { status }); },
});

const ok = (name: string): LLMProvider => ({
  name,
  async generateJSON<T>() { return { from: name } as T; },
  async generateText() { return `text from ${name}`; },
  async generateTextWithGrounding() { return { text: `research from ${name}`, sources: [] }; },
});

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); passed++; console.log(`✅ ${name}`); }
  catch (e) { console.error(`❌ ${name}\n`, e); process.exitCode = 1; }
}

await test('uses primary when it succeeds', async () => {
  const p = new FallbackProvider(ok('Gemini'), ok('Groq'), () => true);
  assert.deepEqual(await p.generateJSON('x'), { from: 'Gemini' });
  assert.equal(p.name, 'Gemini');
});

await test('falls back to Groq on 429', async () => {
  const p = new FallbackProvider(failing(429), ok('Groq'), () => true);
  assert.deepEqual(await p.generateJSON('x'), { from: 'Groq' });
  assert.equal(await p.generateText('x'), 'text from Groq');
  assert.equal((await p.generateTextWithGrounding('x')).text, 'research from Groq');
  assert.equal(p.name, 'Groq');
});

await test('rethrows when Groq is not configured', async () => {
  const p = new FallbackProvider(failing(503), ok('Groq'), () => false);
  await assert.rejects(() => p.generateText('x'), /503/);
});

await test('groqChat sends JSON mode and parses the reply', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  let body: any;
  let auth = '';
  const fetchFn = (async (_url: string, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    auth = (init.headers as Record<string, string>).authorization;
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
  }) as unknown as typeof fetch;
  const out = await groqChat([{ role: 'user', content: 'hi' }], { json: true, fetchFn });
  assert.equal(out, '{"ok":true}');
  assert.equal(auth, 'Bearer test-key');
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.match(JSON.stringify(body.messages), /json/i);
});

await test('groqChat surfaces HTTP errors', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  const fetchFn = (async () => new Response('rate limited', { status: 429 })) as unknown as typeof fetch;
  await assert.rejects(() => groqChat([{ role: 'user', content: 'hi' }], { fetchFn }), /Groq API 429/);
});

console.log(`\n${passed}/5 Groq fallback tests passed`);
