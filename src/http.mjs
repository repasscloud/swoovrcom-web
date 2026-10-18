export function json(status, error) {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(status === 429 ? { 'Retry-After': '60' } : {}), ...(status === 405 ? { Allow: 'POST' } : {}) },
  });
}
export async function readLimited(request, maximum) {
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
export function validEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || /[^\x21-\x7e]/.test(value)) return false;
  const parts = value.split('@');
  if (parts.length !== 2 || parts[0].length > 64 || !parts[0] || parts[0].startsWith('.') || parts[0].endsWith('.') || parts[0].includes('..')) return false;
  return /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(parts[0]) && parts[1].length <= 253 && parts[1].includes('.') && parts[1].split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export function isAllowedOrigin(request, env) {
 const origin = request.headers.get('origin');
 const local = env.LOCAL_DEVELOPMENT === 'true' && ['http://localhost:8787','http://127.0.0.1:8787','http://localhost:4321','http://127.0.0.1:4321','http://127.0.0.1:4325','http://localhost:4325','http://127.0.0.1:8795','http://localhost:8795'].includes(origin);
 return (origin === 'https://swoovr.com' || local) && origin === new URL(request.url).origin;
}
