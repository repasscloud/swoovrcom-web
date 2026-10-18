#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
case "${1:-}" in
  --help) echo 'Usage: ./deploy.sh [--build-only|--dry-run]. Production deploys through Cloudflare Workers Builds from GitHub main.'; exit 0 ;;
  ''|--build-only|--dry-run) ;;
  *) echo 'Unknown argument. Use --help.' >&2; exit 1 ;;
esac
npm run build
npm test
if [[ "${1:-}" != '--build-only' ]]; then node scripts/deploy-worker.mjs --dry-run; fi
