const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
export async function emailFingerprint(email, secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('Invalid dedupe key');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.toLowerCase()));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function encryptSignup(payload, pem) {
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----|\s/g, '')), char => char.charCodeAt(0));
  const publicKey = await crypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['wrapKey']);
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('SWOOVR2:' + payload.id) }, key, new TextEncoder().encode(JSON.stringify(payload)));
  const wrapped = await crypto.subtle.wrapKey('raw', key, publicKey, { name: 'RSA-OAEP' });
  return 'SWOOVR2:' + encode(new TextEncoder().encode(JSON.stringify({ id: payload.id, key: encode(wrapped), iv: encode(iv), data: encode(ciphertext) })));
}
