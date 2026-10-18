import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, privateDecrypt, constants, createDecipheriv } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleWaitlist } from '../src/worker.mjs';
import { emailFingerprint } from '../src/signup-crypto.mjs';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 4096 });
const pem = publicKey.export({ type: 'spki', format: 'pem' });
const env = () => ({ DATABASE_URL: 'postgresql://unused', WAITLIST_DEDUPE_KEY: 'synthetic-test-key-'.repeat(3), WAITLIST_PUBLIC_KEY: pem,
  WAITLIST_RATE_LIMIT: { limit: async () => ({ success: true }) } });
const request = (data = {}, options = {}) => new Request('https://swoovr.com/api/waitlist', {
  method: 'POST', headers: { origin: 'https://swoovr.com', 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'person@example.com', consent: true, adult: true, ...data }), ...options,
});
const never = () => assert.fail('must not store');
test('rejects malformed email, missing permission/adult declaration and invalid optional fields', async () => {
  for (const data of [{email:'bad'}, {consent:false}, {adult:false}, {email:'a@b.com\r\nBcc:x@y.com'}, {email:'a'.repeat(65)+'@example.com'}, {referralCode:'bad code!'}, {referralCode:'x'.repeat(65)}, {city:'x'.repeat(101)}, {city:[]}, {betaInterest:'yes'}]) {
    assert.equal((await handleWaitlist(request(data),env(),never)).status,400);
  }
});
test('enforces origin, method, content type, JSON and bounded bodies', async () => {
  for (const origin of ['https://other.example','null','']) {
    const r=request();r.headers.set('origin',origin);assert.equal((await handleWaitlist(r,env(),never)).status,403);
  }
  assert.equal((await handleWaitlist(new Request('https://swoovr.com/api/waitlist'),env(),never)).status,405);
  const r=request();r.headers.set('content-type','text/plain');assert.equal((await handleWaitlist(r,env(),never)).status,415);
  assert.equal((await handleWaitlist(request({city:'x'.repeat(5000)}),env(),never)).status,413);
  assert.equal((await handleWaitlist(request({}, {body:'{'}),env(),never)).status,400);
});
test('rate limit, configuration and database failures never claim signup success', async () => {
  const e=env();e.WAITLIST_RATE_LIMIT.limit=async()=>({success:false});
  assert.equal((await handleWaitlist(request(),e,never)).status,429);
  for(const name of ['DATABASE_URL','WAITLIST_DEDUPE_KEY','WAITLIST_PUBLIC_KEY','WAITLIST_RATE_LIMIT']) {
    const e=env(); delete e[name]; assert.equal((await handleWaitlist(request(),e,never)).status,503);
  }
  assert.equal((await handleWaitlist(request(),env(),async()=>{throw new Error('database unavailable')})).status,502);
});
test('honeypot is discarded without database writes', async()=>{
  assert.equal((await handleWaitlist(request({website:'spam'}),env(),never)).status,202);
});
test('stores authenticated encrypted payload including optional referral; no plaintext PII reaches storage',async()=>{
  let saved;
  const response=await handleWaitlist(request({city:'Adelaide',referralCode:'FRIEND_123',betaInterest:true}),env(),async r=>{saved=r});
  assert.equal(response.status,202);assert.deepEqual(await response.json(),{ok:true});
  assert.equal(JSON.stringify(saved).includes('person@example.com'),false);
  assert.equal(JSON.stringify(saved).includes('FRIEND_123'),false);
  const envelope=JSON.parse(Buffer.from(saved.encrypted.slice(8),'base64'));
  const aes=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},Buffer.from(envelope.key,'base64'));
  const data=Buffer.from(envelope.data,'base64');
  const decipher=createDecipheriv('aes-256-gcm',aes,Buffer.from(envelope.iv,'base64'));
  decipher.setAAD(Buffer.from('SWOOVR2:'+saved.id));decipher.setAuthTag(data.subarray(-16));
  const payload=JSON.parse(Buffer.concat([decipher.update(data.subarray(0,-16)),decipher.final()]));
  assert.equal(payload.email,'person@example.com');assert.equal(payload.submittedReferralCode,'FRIEND_123');
  const directory = mkdtempSync(join(tmpdir(), 'swoovr-decrypt-test-'));
  try {
    const keyPath = join(directory, 'private.pem');
    writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    const decoded = spawnSync(process.execPath, ['scripts/decrypt-waitlist.mjs', keyPath], { input: saved.encrypted, encoding: 'utf8' });
    assert.equal(decoded.status, 0, decoded.stderr);
    assert.deepEqual(JSON.parse(decoded.stdout), payload);
    envelope.id = crypto.randomUUID();
    const tampered = 'SWOOVR2:' + Buffer.from(JSON.stringify(envelope)).toString('base64');
    assert.notEqual(spawnSync(process.execPath, ['scripts/decrypt-waitlist.mjs', keyPath], { input: tampered, encoding: 'utf8' }).status, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
  assert.equal(payload.city,'Adelaide');assert.equal(payload.betaInterest,true);assert.equal(payload.adult,true);
  assert.match(saved.referralCode,/^[a-f0-9]{32}$/);assert.match(saved.emailHash,/^[a-f0-9]{64}$/);
});
test('optional fields can be omitted; same email has a stable secret-keyed fingerprint',async()=>{
  assert.equal((await handleWaitlist(request(),env(),async()=>{})).status,202);
  const key=env().WAITLIST_DEDUPE_KEY;
  assert.equal(await emailFingerprint('Person@Example.com',key),await emailFingerprint('person@example.com',key));
  assert.notEqual(await emailFingerprint('person@example.com',key),await emailFingerprint('person@example.com',key+'other'));
});
