import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const key = process.argv[2] || join(homedir(), '.config', 'swoovr', 'waitlist', 'private.pem');
const input = readFileSync(0, 'utf8').trim();
const encoded = input.replace(/^SWOOVR1:/, '').replace(/\s/g, '');
if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || Buffer.from(encoded, 'base64').length !== 512) throw new Error('Paste only the SWOOVR1: notification body on stdin.');
const result = spawnSync('openssl', ['pkeyutl', '-decrypt', '-inkey', key, '-pkeyopt', 'rsa_padding_mode:oaep', '-pkeyopt', 'rsa_oaep_md:sha256', '-pkeyopt', 'rsa_mgf1_md:sha256'], { input: Buffer.from(encoded, 'base64') });
if (result.status !== 0) { console.error('Decryption failed. Check the private key and complete notification body.'); process.exit(1); }
console.log(JSON.stringify(JSON.parse(result.stdout.toString()), null, 2));
