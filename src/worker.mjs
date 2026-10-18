import { json, readLimited, validEmail, isAllowedOrigin } from './http.mjs';
import { handleEnquiry } from './enquiries.mjs';
import publishedRoutes from './data/published-routes.json' with { type: 'json' };
import config from '../site.config.json' with { type: 'json' };
const ORIGINS = new Set(['https://swoovr.com']);
import { encryptSignup, emailFingerprint } from './signup-crypto.mjs';
const CONSENT = 'waitlist-2026-10-18';
const MAX_BYTES = 4096;
export async function handleWaitlist(request, env, store) {
  if (request.method !== 'POST') return json(405, 'Use POST.');
  if (!isAllowedOrigin(request, env)) return json(403, 'Please submit the form from this website.');
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json(415, 'Use JSON.');
  if (!env.DATABASE_URL || !env.WAITLIST_DEDUPE_KEY || !env.WAITLIST_PUBLIC_KEY || !env.WAITLIST_RATE_LIMIT) return json(503, 'The waitlist is temporarily unavailable. Please try again later.');
  try {
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    if (!(await env.WAITLIST_RATE_LIMIT.limit({ key: `waitlist:${ip}` })).success) return json(429, 'Please wait a minute before trying again.');
  } catch { return json(503, 'The waitlist is temporarily unavailable.'); }
  let data;
  try { data = JSON.parse(await readLimited(request, MAX_BYTES)); }
  catch (error) { return json(error.message === 'too_large' ? 413 : 400, 'Please check your submission.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json(400, 'Please check your submission.');
  if (typeof data.website === 'string' && data.website) return json(202);
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  if (!validEmail(email) || data.consent !== true) return json(400, 'Enter a valid email address and agree to receive Swoovr launch updates.');
  const referralCode = data.referralCode ?? '';
  const city = data.city ?? '';
  if (typeof referralCode !== 'string' || referralCode.length > 64 || !/^[a-zA-Z0-9_-]*$/.test(referralCode) || typeof city !== 'string' || (city !== '' && !config.cities.includes(city)) || city.length > 100 || /[\x00-\x1f\x7f]/.test(city) || data.adult !== true || (data.betaInterest !== undefined && typeof data.betaInterest !== 'boolean')) {
    return json(400, 'Confirm you are 18 or over and check your city and referral code.');
  }
  let record;
  try {
    const id = crypto.randomUUID();
    const at = new Date().toISOString();
    const ownReferralCode = crypto.randomUUID().replaceAll('-', '');
    record = { id, emailHash: await emailFingerprint(email, env.WAITLIST_DEDUPE_KEY), referralCode: ownReferralCode,
      encrypted: await encryptSignup({ id, email, city: city.trim(), adult: true, betaInterest: data.betaInterest === true,
        submittedReferralCode: referralCode || null, consent: CONSENT, privacy: 'privacy-2026-10-18', at }, env.WAITLIST_PUBLIC_KEY) };
  } catch { return json(503, 'The waitlist is temporarily unavailable.'); }
  try {
    const persist = store ?? (await import('./signup-store.mjs')).storeSignup;
    await persist(record, env);
    return json(202);
  } catch {
    // Never log addresses, ciphertext, credentials or database exception details.
    console.warn(JSON.stringify({ event: 'waitlist_storage', outcome: 'not_confirmed' }));
    return json(502, 'We could not confirm your signup. Please try again later.');
  }
}
// Only the corporate hostname is served in production.
function indexingResponse(request, origin, path) {
  if (!origin) return new Response('Not found', { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  let body; let contentType;
  if (path === '/robots.txt') {
    body = `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap-index.xml\n`;
    contentType = 'text/plain; charset=utf-8';
  } else {
    const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
    body = path === '/sitemap-index.xml'
      ? `${declaration}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${origin}/sitemap.xml</loc></sitemap></sitemapindex>`
      : `${declaration}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publishedRoutes.map(page => `<url><loc>${origin}${page}</loc></url>`).join('')}</urlset>`;
    contentType = 'application/xml; charset=utf-8';
  }
  return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const local = env.LOCAL_DEVELOPMENT === 'true' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (!ORIGINS.has(url.origin) && !local) return new Response('Not found', { status: 404 });
    const origin = ORIGINS.has(url.origin) ? url.origin : null;
    if (['/sitemap.xml', '/sitemap-index.xml', '/robots.txt'].includes(path)) return indexingResponse(request, origin || (local ? 'https://swoovr.com' : null), path);
    if (path === '/api/enquiries') return handleEnquiry(request, env);
    if (path === '/api/waitlist') return handleWaitlist(request, env);
    if (path.startsWith('/api/')) return json(404, 'Not found.');
    const response = await env.ASSETS.fetch(request);
    if (!origin || !response.ok || !response.headers.get('content-type')?.includes('text/html') || request.method === 'HEAD') return response;
    // Streaming rewrite avoids sharing a build-time canonical across hosts.
    const headers = new Headers(response.headers);
    headers.delete('etag'); headers.delete('content-length');
    const html = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    return new HTMLRewriter()
      .on('link[rel="canonical"]', { element(element) {
        element.setAttribute('href', new URL(element.getAttribute('href'), origin).href);
      } })
      .on('meta[property="og:url"]', { element(element) {
        element.setAttribute('content', new URL(element.getAttribute('content'), origin).href);
      } })
      .on('link[rel="sitemap"]', { element(element) {
        element.setAttribute('href', `${origin}/sitemap-index.xml`);
      } })
      .transform(html);
  },
};
