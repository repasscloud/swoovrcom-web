import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dryRun = process.argv.includes('--dry-run');
const variables = existsSync('.dev.vars') ? parseEnv(readFileSync('.dev.vars', 'utf8')) : {};
const token = variables.MAILERSEND_API_KEY;
if (!dryRun && (!token || /^(replace|your|example|test)/i.test(token))) {
  console.error('Deployment stopped: put a valid MAILERSEND_API_KEY in the ignored .dev.vars file. No secrets are read from other projects.');
  process.exit(1);
}
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
if (!config.vars.WAITLIST_PUBLIC_KEY) throw new Error('Run npm run key:setup first and back up your private key.');
const temp = mkdtempSync(join(tmpdir(), 'swoovr-deploy-'));
try {
  const args = ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', 'wrangler.jsonc'];
  if (dryRun) args.push('--dry-run');
  else {
    // Only the mail token is uploaded. LOCAL_DEVELOPMENT is never deployed.
    const secrets = join(temp, 'secrets.json');
    writeFileSync(secrets, JSON.stringify({ MAILERSEND_API_KEY: token }), { mode: 0o600 });
    args.push('--secrets-file', secrets);
  }
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false', WRANGLER_LOG_SANITIZE: 'true' } });
  process.exitCode = result.status ?? 1;
} finally { rmSync(temp, { recursive: true, force: true }); }
