# Corporate-site verification

18 October 2026, local implementation on `codex/corporate-site-supabase`.

- Astro build and Wrangler dry-run packaging succeed. These do not upload a Worker.
- API tests check input bounds, permission/adult declarations, optional city/beta/referral fields, origin isolation, honeypot, throttling, configuration failures and database-error responses.
- Encrypted submission round-trip uses a synthetic RSA keypair and authenticated AES envelope. The offline helper decrypts it; changing the authenticated record ID fails decryption. No live person is submitted.
- Indexing/runtime and analytics tests verify the corporate host, canonical metadata, sitemap and consent controls. Other production hostnames are rejected.
- Migration applied successfully to disposable PostgreSQL 17 in Docker with synthetic Supabase `anon`/`authenticated` roles. A restricted-role insert succeeded; repeated email fingerprint inserted zero additional rows. SELECT, UPDATE and DELETE were each rejected. The production Supabase pooler, TLS connection and Cloudflare-to-Supabase write are not yet verified.
- The actual packaged Worker starts under Wrangler locally. Local mode needs `--local-upstream localhost:8787` because Wrangler otherwise rewrites the request host from the configured production route; the documented local script includes that option.
- In-app browser review at the available narrow panel width verified readable content and the collapsed/expanded referral field, separate adult/marketing checkboxes and analytics refusal. Full desktop and 390px device-emulation screenshots were not captured; review those during final owner cutover.
- Source scan finds no former application-host references in project text. Git history and ignored local caches/credentials are not rewritten.

No GitHub push, production release, route migration, Supabase project creation or email sending was performed. Existing untracked marketing/source notes were retained and their corporate website references normalised; historical architecture descriptions are marked as snapshots where relevant.
