#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
case "${1:-}" in
  --help) echo 'Usage: ./deploy.sh [--build-only|--dry-run]'; echo 'Build and manually deploy the swoovr-web Worker with Wrangler. Requires .dev.vars with MAILERSEND_API_KEY.'; exit 0 ;;
  ''|--build-only|--dry-run) ;;
  *) echo 'Unknown argument. Use --help.' >&2; exit 1 ;;
esac
command -v node >/dev/null || { echo 'Install Node.js 22.12 or newer first.' >&2; exit 1; }
if [[ ! -d node_modules ]]; then npm ci; fi
npm test
npm run build
if [[ "${1:-}" == '--build-only' ]]; then exit 0; fi
node scripts/deploy-worker.mjs "${1:-}"
