import { json, readLimited, validEmail, isAllowedOrigin } from './http.mjs';
import { encryptSignup } from './signup-crypto.mjs';
import config from '../site.config.json' with { type: 'json' };
const TOPICS = ['general', 'venue', 'press', 'feedback', 'privacy', 'support'];
const DEVICES = ['iOS', 'Android', 'Both', 'Web'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function text(value, max, min = 0) {
 return typeof value === 'string' && value.trim().length >= min && value.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
}
export async function handleEnquiry(request, env, store) {
 if (request.method !== 'POST') return json(405, 'Use POST.');
 if (!isAllowedOrigin(request, env)) return json(403, 'Please send your enquiry from this website.');
 if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json(415, 'Use JSON.');
 if (!env.DATABASE_URL || !env.WAITLIST_PUBLIC_KEY || !env.WAITLIST_RATE_LIMIT) return json(503, 'Enquiries are temporarily unavailable. Please try again later, or email hello@repasscloud.com.');
 try {
  if (!(await env.WAITLIST_RATE_LIMIT.limit({key:`enquiry:${request.headers.get('cf-connecting-ip') || 'local'}`})).success) return json(429, 'Please wait a minute before trying again.');
 } catch { return json(503, 'Enquiries are temporarily unavailable.'); }
 let data;
 try { data = JSON.parse(await readLimited(request, 16384)); }
 catch (error) { return json(error.message === 'too_large' ? 413 : 400, 'Please check your message and try again.'); }
 if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, 'Please check your message.');
 if (typeof data.website === 'string' && data.website) return json(202);
 const fields = ['requestId','kind','name','email','topic','organisation','city','device','availability','message','replyConsent','adult','website'];
 const beta = data.kind === 'beta';
 const email = typeof data.email === 'string' ? data.email.trim() : '';
 if (Object.keys(data).some(key => !fields.includes(key)) || typeof data.requestId !== 'string' || !uuid.test(data.requestId) || !['contact','beta'].includes(data.kind) || !text(data.name,100,1) || !validEmail(email) || !text(data.message,3000,10) || data.replyConsent !== true || !text(data.organisation ?? '',160) || !text(data.availability ?? '',200) || !text(data.city ?? '',100) || (data.city && !config.cities.includes(data.city)) || (data.device && !DEVICES.includes(data.device)) || (beta && (data.adult !== true || !DEVICES.includes(data.device))) || (!beta && !TOPICS.includes(data.topic ?? 'general'))) return json(400, 'Check your name, email, message and permission to reply. Beta participants must be 18 or over and select a device.');
 try {
  const record = {id:data.requestId, kind:data.kind, encrypted:await encryptSignup({
   id:data.requestId, kind:data.kind, name:data.name.trim(), email, topic:beta ? 'beta' : data.topic ?? 'general', organisation:(data.organisation ?? '').trim(), city:data.city ?? '', device:data.device ?? '', availability:(data.availability ?? '').trim(), message:data.message.trim(), replyConsent:true, ...(beta ? {adult:true} : {}), privacy:'privacy-2026-10-18', consent:'enquiry-2026-10-18', at:new Date().toISOString(),
  }, env.WAITLIST_PUBLIC_KEY)};
  const persist = store ?? (await import('./signup-store.mjs')).storeEnquiry;
  await persist(record, env);
  return json(202);
 } catch {
  console.warn(JSON.stringify({event:'enquiry_storage',outcome:'not_confirmed'}));
  return json(502, 'Your message could not be saved. Please try again later, or email hello@repasscloud.com with “Swoovr” in the subject.');
 }
}
