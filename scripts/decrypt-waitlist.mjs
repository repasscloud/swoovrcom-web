import { readFileSync } from 'node:fs';
import { privateDecrypt, constants, createDecipheriv } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
const key = readFileSync(process.argv[2] || join(homedir(), '.config', 'swoovr', 'waitlist', 'private.pem'));
const input = readFileSync(0, 'utf8').trim();
const unwrap = data => privateDecrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(data, 'base64'));
let plaintext;
if (input.startsWith('SWOOVR2:')) {
  const envelope = JSON.parse(Buffer.from(input.slice(8), 'base64').toString());
  const data = Buffer.from(envelope.data, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', unwrap(envelope.key), Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from('SWOOVR2:' + envelope.id));
  decipher.setAuthTag(data.subarray(-16));
  plaintext = Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]);
} else if (input.startsWith('SWOOVR1:')) {
  plaintext = unwrap(input.slice(8));
} else { throw new Error('Supply one SWOOVR1 or SWOOVR2 record on stdin.'); }
console.log(JSON.stringify(JSON.parse(plaintext.toString()), null, 2));
