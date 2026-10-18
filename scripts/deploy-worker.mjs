// Production releases belong to Cloudflare Workers Builds connected to GitHub.
// This helper only packages the Worker for local verification.
import { spawnSync } from 'node:child_process';
if (!process.argv.includes('--dry-run')) {
  console.error('Connect this repository to Cloudflare Workers Builds on main. Local deployment is disabled.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run'], {
  stdio: 'inherit', env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' },
});
process.exitCode = result.status ?? 1;
