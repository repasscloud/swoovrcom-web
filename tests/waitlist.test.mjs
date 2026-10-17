import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, privateDecrypt, constants } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleWaitlist } from '../src/worker.mjs';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 4096 });
const pem = publicKey.export({ type: 'spki', format: 'pem' });
const env = () => ({ MAILERSEND_API_KEY: 'test-token', WAITLIST_PUBLIC_KEY: pem,
  WAITLIST_RATE_LIMIT: { limit: async () => ({ success: true }) } });
const request = (data = {}, options = {}) => new Request('https://swoovr.app/api/waitlist', {
  method: 'POST', headers: { origin: 'https://swoovr.app', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1', ...options.headers },
  body: JSON.stringify({ email: 'person@example.com', consent: true, website: '', ...data }), ...options,
});
const accepted = async () => new Response(null, { status: 202, headers: { 'x-message-id': 'test-id' } });
test('rejects invalid email, absent consent and header injection without sending', async () => {
  for (const data of [{ email: 'bad' }, { consent: false }, { email: 'a@b.com\r\nBcc: x@y.com' }, { email: `${'a'.repeat(65)}@example.com` }]) {
    const res = await handleWaitlist(request(data), env(), () => assert.fail('must not send'));
    assert.equal(res.status, 400);
  }
});
test('rejects cross-site and absent Origin', async () => {
  for (const origin of ['https://attacker.example', 'null', '']) {
    const req = request(); req.headers.set('origin', origin);
    assert.equal((await handleWaitlist(req, env(), accepted)).status, 403);
  }
});
test('enforces method, content type, byte limit and invalid JSON', async () => {
  assert.equal((await handleWaitlist(new Request('https://swoovr.app/api/waitlist'), env(), accepted)).status, 405);
  const wrongType = request(); wrongType.headers.set('content-type', 'text/plain');
  assert.equal((await handleWaitlist(wrongType, env(), accepted)).status, 415);
  assert.equal((await handleWaitlist(request({ extra: 'x'.repeat(5000) }), env(), accepted)).status, 413);
  const malformed = new Request('https://swoovr.app/api/waitlist', { method: 'POST', headers: { origin: 'https://swoovr.app', 'content-type': 'application/json' }, body: '{' });
  assert.equal((await handleWaitlist(malformed, env(), accepted)).status, 400);
});
test('fails closed on missing configuration or rate limit binding', async () => {
  for (const name of ['MAILERSEND_API_KEY', 'WAITLIST_PUBLIC_KEY', 'WAITLIST_RATE_LIMIT']) {
    const config = env(); delete config[name];
    assert.equal((await handleWaitlist(request(), config, () => assert.fail('must not send'))).status, 503);
  }
});
test('throttles before sending and discards honeypot submissions', async () => {
  const config = env(); config.WAITLIST_RATE_LIMIT.limit = async () => ({ success: false });
  assert.equal((await handleWaitlist(request(), config, accepted)).status, 429);
  assert.equal((await handleWaitlist(request({ website: 'spam' }), env(), () => assert.fail('must not send'))).status, 202);
});
test('uses fixed routing and encrypts email and consent; OpenSSL can decrypt', async () => {
  let payload;
  const res = await handleWaitlist(request({ to: 'attacker@example.com' }), env(), async (url, init) => {
    assert.equal(url, 'https://api.mailersend.com/v1/email');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    payload = JSON.parse(init.body); return accepted();
  });
  assert.equal(res.status, 202);
  assert.equal(payload.from.email, 'hello@repasscloud.com');
  assert.deepEqual(payload.to, [{ email: 'swoovr.app@repasscloud.com' }]);
  assert.equal(payload.subject, 'swoovr app waitlist signup');
  assert.equal(JSON.stringify(payload).includes('person@example.com'), false);
  assert.equal(payload.settings.track_content, false);
  const ciphertext = Buffer.from(payload.text.replace('SWOOVR1:', '').trim(), 'base64');
  const plaintext = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, ciphertext);
  assert.equal(JSON.parse(plaintext).email, 'person@example.com');
  assert.equal(JSON.parse(plaintext).consent, 'waitlist-2026-10-17');
  const temp = mkdtempSync(join(tmpdir(), 'swoovr-test-'));
  try {
    const keyFile = join(temp, 'key.pem');
    writeFileSync(keyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    const openssl = spawnSync('openssl', ['pkeyutl', '-decrypt', '-inkey', keyFile, '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'], { input: ciphertext });
    assert.equal(openssl.status, 0, openssl.stderr.toString());
    assert.deepEqual(openssl.stdout, plaintext);
  } finally { rmSync(temp, { recursive: true }); }
});
test('provider rejection, suppression, pause, missing ID and transport failure never claim success', async () => {
  for (const response of [new Response(null, { status: 422 }), new Response(null, { status: 429 }), new Response(null, { status: 202 }), new Response(JSON.stringify({ warnings: [{ type: 'ALL_SUPPRESSED' }] }), { status: 202, headers: { 'x-message-id': 'id' } }), new Response(null, { status: 202, headers: { 'x-message-id': 'id', 'x-send-paused': 'true' } })]) {
    assert.equal((await handleWaitlist(request(), env(), async () => response)).status, 502);
  }
  assert.equal((await handleWaitlist(request(), env(), async () => { throw new Error('network'); })).status, 502);
});
