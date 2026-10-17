import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const folder = join(homedir(), '.config', 'swoovr', 'waitlist');
const privatePath = join(folder, 'private.pem');
const publicPath = join(folder, 'public.pem');
mkdirSync(folder, { recursive: true, mode: 0o700 });
if (!existsSync(privatePath) && !existsSync(publicPath)) {
  const pair = generateKeyPairSync('rsa', { modulusLength: 4096, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  writeFileSync(privatePath, pair.privateKey, { flag: 'wx', mode: 0o600 });
  writeFileSync(publicPath, pair.publicKey, { flag: 'wx', mode: 0o600 });
} else if (!existsSync(privatePath) || !existsSync(publicPath)) {
  throw new Error('Incomplete existing key pair. Restore it; do not replace keys without retaining old private keys.');
}
// Only the public key is copied to deployable configuration.
const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const publicKey = readFileSync(publicPath, 'utf8');
if (config.vars.WAITLIST_PUBLIC_KEY && config.vars.WAITLIST_PUBLIC_KEY !== publicKey) throw new Error('Configured public key differs. Key rotation requires retaining the previous private key.');
config.vars.WAITLIST_PUBLIC_KEY = publicKey;
writeFileSync(new URL('../wrangler.jsonc', import.meta.url), JSON.stringify(config, null, 2) + '\n');
console.log(`Public encryption key configured. Private key: ${privatePath}\nBack up the private key securely. Losing it makes existing notifications unrecoverable.`);
