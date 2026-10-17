const ORIGINS = new Set(['https://swoovr.app', 'https://swoovr.com']);
const CONSENT = 'waitlist-2026-10-17';
const MAX_BYTES = 4096;
function json(status, error) {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(status === 429 ? { 'Retry-After': '60' } : {}), ...(status === 405 ? { Allow: 'POST' } : {}) },
  });
}
async function readLimited(request, maximum) {
  if (Number(request.headers.get('content-length')) > maximum) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) { await reader.cancel(); throw new Error('too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
function validEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || /[^\x21-\x7e]/.test(value)) return false;
  const parts = value.split('@');
  if (parts.length !== 2 || parts[0].length > 64 || !parts[0] || parts[0].startsWith('.') || parts[0].endsWith('.') || parts[0].includes('..')) return false;
  return /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(parts[0]) && parts[1].length <= 253 && parts[1].includes('.') && parts[1].split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}
export async function handleWaitlist(request, env, send = fetch) {
  if (request.method !== 'POST') return json(405, 'Use POST.');
  const origin = request.headers.get('origin');
  const local = env.LOCAL_DEVELOPMENT === 'true' && ['http://localhost:8787', 'http://127.0.0.1:8787'].includes(origin);
  if ((!ORIGINS.has(origin) && !local) || origin !== new URL(request.url).origin) return json(403, 'Please submit the form from this website.');
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json(415, 'Use JSON.');
  if (!env.MAILERSEND_API_KEY || !env.WAITLIST_PUBLIC_KEY || !env.WAITLIST_RATE_LIMIT) return json(503, 'The waitlist is temporarily unavailable. Please try again later.');
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
  let encrypted;
  try {
    const der = Uint8Array.from(atob(env.WAITLIST_PUBLIC_KEY.replace(/-----[^-]+-----|\s/g, '')), char => char.charCodeAt(0));
    const key = await crypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
    const plaintext = JSON.stringify({ email, consent: CONSENT, at: new Date().toISOString() });
    const bytes = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(plaintext)));
    encrypted = 'SWOOVR1:' + btoa(String.fromCharCode(...bytes));
  } catch { return json(503, 'The waitlist is temporarily unavailable.'); }
  try {
    const response = await send('https://api.mailersend.com/v1/email', {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.MAILERSEND_API_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ from: { email: 'hello@repasscloud.com', name: 'Swoovr' },
        to: [{ email: 'swoovr.app@repasscloud.com' }], subject: 'swoovr app waitlist signup', text: encrypted,
        settings: { track_clicks: false, track_opens: false, track_content: false } }),
    });
    if (response.status !== 202 || !response.headers.get('x-message-id') || response.headers.get('x-send-paused') === 'true') throw new Error('not_accepted');
    const text = await readLimited(response, 32768);
    if (text.trim()) {
      const body = JSON.parse(text);
      if (!body || body.warnings && (!Array.isArray(body.warnings) || body.warnings.length)) throw new Error('provider_warning');
    }
    return json(202);
  } catch {
    // Never log submitted addresses, ciphertext, tokens, or provider response bodies.
    console.warn(JSON.stringify({ event: 'waitlist_notification', outcome: 'not_confirmed' }));
    return json(502, 'We could not confirm your signup. Please try again later.');
  }
}
// Each public host owns its search metadata. No cross-domain canonical or redirect.
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
      : `${declaration}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/privacy/'].map(page => `<url><loc>${origin}${page}</loc></url>`).join('')}</urlset>`;
    contentType = 'application/xml; charset=utf-8';
  }
  return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = ORIGINS.has(url.origin) ? url.origin : null;
    if (['/sitemap.xml', '/sitemap-index.xml', '/robots.txt'].includes(path)) return indexingResponse(request, origin, path);
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
