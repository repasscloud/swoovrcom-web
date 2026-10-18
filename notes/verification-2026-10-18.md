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

## Homepage and referral follow-up

The compact homepage and its complete signup, launch consent, sign-off and photo controls were measured in real browser iframe viewports at 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 1280×600, 844×390, 667×375, 568×320 and 500×375. All 13 fit the initial viewport without horizontal overflow. Enlarged text and form messages may expand the page naturally; no content is clipped to enforce a fixed height. The mobile menu and relocated pause/play control were exercised in the browser.

The dedicated `/referral/` form accepts a code, email, adult declaration and launch-update permission, with no beta checkbox. A shareable code prefill and browser submission were verified against the isolated local database; encrypted data retained the submitted code and did not opt into beta interest. The compact homepage signup also saved successfully. Neither test sent email or used the hosted database.

The final build contains 11 sitemap pages plus the custom 404. All 26 tests and Wrangler dry-run packaging pass. The temporary viewport-review page was removed before the final build. The new viewport measurements and desktop/mobile screenshots are in ignored `artifacts/review/`. Nothing was pushed or deployed.

## Buttons, scroll header and referral theme follow-up

Browser checks confirm the homepage action is approximately 159px wide inside a 490px form at desktop sizes; referral registration is approximately 200px wide inside a 580px form. Decorative button arrows are removed. The referral background and logo computed colours match `#1e3857` and `#d0b786`; navigating home restores its original branding.

The shared header remains fixed at viewport top after scrolling on the homepage and referral page. Desktop About and FAQs anchors clear the header, and the mobile menu closes after selecting a section. Keyboard Tab visibly focuses Skip to content above the header (z-index 100 vs 30). All 13 previously recorded hero viewport sizes still fit with the updated header and buttons. Local screenshots and refreshed measurements are under ignored `artifacts/review/`.
