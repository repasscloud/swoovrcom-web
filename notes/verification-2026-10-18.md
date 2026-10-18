# Corporate pages and enquiries — current local verification

18 October 2026, `codex/corporate-pages-and-enquiries`.

- Final production build: 10 sitemap pages plus the custom 404. All 24 unit/runtime checks pass. Wrangler dry-run packaging succeeds without database access or upload.
- Browser-submitted newsletter, contact and beta forms each save successfully through the actual local Worker and restricted PostgreSQL role. Enquiry ciphertext was decrypted privately with the isolated local key and compared with synthetic test input.
- Disposable PostgreSQL 18 checks cover fresh migration application, replay, checksums, transaction rollback, duplicate enquiry request IDs, denied reads/updates, legacy baseline adoption and refusal of deliberately weakened policies/constraints.
- Temporarily publishing one draft locally produced its page, listing and sitemap manifest entry. Restoring draft mode removed them. All five final articles remain drafts. The production Worker returns 404 for draft paths; the Astro preview renders them with noindex metadata.
- All ten production URLs return 200 through the local Worker with corporate metadata; its sitemap matches the actual build. Internal links and shared social/footer elements pass output checks.
- Browser visual review uses real embedded 390px and 1280px viewports. Contact layout fits both; desktop navigation now has an opaque background so moving portraits do not compromise readability. Local screenshots are in ignored `artifacts/review/`. The contact-topic query is handled in the browser so venue/privacy links work on static pages.
- Independent code review found two issues, both corrected and re-reviewed: no migrations from a dry-run build hook, and exact rather than substring-based legacy baseline verification.

Local review is running on 4325, production-build preview on 8795, with an isolated database on 55439. Existing app preview ports 4321/8787 were preserved. No production data, secrets, remote settings, routes, deployment or main push was changed. Live Cloudflare-to-Supabase TLS/insertion and hosted release configuration remain unverified. Before eventual deployment, set the Cloudflare deploy command to `npm run release` and add the build-only `MIGRATION_DATABASE_URL` secret. Enquiry notification delivery and an admin inbox are outside this implementation; the authorised team must monitor database enquiries.

The earlier implementation snapshot follows for provenance.

---

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
