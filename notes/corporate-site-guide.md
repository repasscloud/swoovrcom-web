# Corporate site, publishing and release guide

18 October 2026. Owner instruction: local review only; no push to main or deployment.

## Local review

Run `npm run dev:review`. It builds the production site, creates an isolated PostgreSQL cluster under ignored `.wrangler/corporate-review`, applies the real migrations and starts:

- http://127.0.0.1:4325/ — Astro development, including draft news articles labelled as drafts and noindexed.
- http://127.0.0.1:8795/ — the production build, without draft routes or listings.

Both forms use the local Worker and an insert-only local database role. This command never loads `.env` or `.dev.vars`; the local encryption keypair and email fingerprint key live inside the ignored review directory. All records here are local test records. Stop the foreground command to stop its servers and database. Existing ports 4321/8787 are left alone. PostgreSQL 18 at the Homebrew path is the local default; override `SWOOVR_POSTGRES_BIN` for another installation. Node 22.12+ is required. Local connections may omit TLS only with `LOCAL_DEVELOPMENT=true` and a loopback database host; remote database TLS verification remains required.

The retained local private key can decrypt test enquiry payloads using the existing `waitlist:decrypt` tool. Inspect records privately; do not paste decrypted production messages into logs or issues. RePass Cloud staff must monitor enquiries through authorised database handling; this implementation does not send notifications or add an inbox interface.

## Content and publishing

Public pages: home, about, how it works, safety, verification, venues, beta, contact, news, referral signup and website privacy. Shared navigation and footer link these journeys. Production sitemaps are generated from actual output routes and served by the Worker; 404, API and draft routes are excluded.

Articles live in `src/content/news/*.md`. Frontmatter requires title, description, date, category and draft (defaults to true). Author defaults to Swoovr team. Five complete articles are deliberately drafts. To publish, review facts and product status, set `draft: false`, choose the actual publication date, build and test. The route, news listing and sitemap then include the article automatically. Returning to `draft: true` removes it on the next production build. No secret preview URLs are used. Development draft pages use `noindex, nofollow` and do not enter the production manifest.

A draft's date is editorial metadata, not an announcement of a launch. Review publication timing; future-dated non-draft articles are currently published immediately. Markdown is trusted repository content, not user input. Do not commit private information in an article.

## Social channels and cities

`site.config.json` contains all social URLs and Australian city options. X and Instagram use the owner's URLs. LinkedIn, TikTok and Facebook retain icons with `#` placeholders, accessible “link to be announced” labels and suppressed navigation. Replace the URL and remove `placeholder: true` when the owner supplies the correct account. Nothing has been invented for those accounts.

The city allowlist is shared by the frontend and API. Optional city may be empty. Other supports interest outside the listed cities without collecting precise location.

## Enquiries and privacy

`POST /api/enquiries` supports contact and beta. The existing OpenAPI file now describes both submission endpoints. Beta captures name, email, city, device, optional availability, message, reply permission and adult declaration. Contact captures name, email, optional organisation, topic, message and reply permission. Neither enrols someone in marketing.

Messages and personal fields use the existing SWOOVR2 envelope and offline private key model. Only request ID, kind and timestamps are readable in the enquiry table. A UUID supports retry deduplication. Same-origin checks, body/field limits, allowlists, honeypot and rate limiting apply. Success follows durable acceptance; failures remain visible and retain the form. No automatic reply, invitation or staff notification is claimed. The local banner distinguishes local-only storage.

Enquiries expire after 12 months. Extend the existing administrative retention job to delete expired rows from both `private.signups` and `private.enquiries`; an expiry column alone is not an automated deletion system. Existing manual access/correction/suppression handling remains the operating process.

## Automatic database migrations at deployment

Set the Cloudflare Workers Builds **deploy command to `npm run deploy`**. The runner applies pending migrations on `main` before uploading. Keep the build command **`npm ci && npm run build && npm test`**. Disable non-production deploys. The release runner requires Workers Builds and branch `main`, applies pending migrations, then invokes Wrangler. Migration failure stops the upload. The checked-in Wrangler build guard refuses direct CI uploads that bypass this runner. Local development and dry-run packaging never invoke migrations. A direct CI dry run without the runner marker fails closed without database access.

Add **`MIGRATION_DATABASE_URL` as a build-only secret**, using the database administrator's direct or session-pooler connection. Never add it to Wrangler vars, browser configuration or Worker runtime secrets. The runtime `DATABASE_URL` continues to use restricted `swoovr_signup` credentials with the transaction pooler. Migration connections on port 6543 are refused because the advisory lock requires session affinity. Do not disable TLS validation; provide the appropriate trusted CA in CI if needed.

`npm run db:migrate` applies pending SQL from `supabase/migrations` using the explicitly supplied migration environment. It does not automatically load the project's local .env. Each file is applied with its ledger entry in one transaction, guarded by a session advisory lock. Checksums prevent editing previously applied migrations. The unchanged first migration may be adopted from the previous SQL-editor setup only when its table shape, defaults, constraints, RLS, policy and restricted role pass validation; otherwise deployment stops for review. Later schema changes must use a new migration file.

The runner uses backward-compatible additive migrations. An upload failure after a migration leaves the applied schema in place; do not automatically roll back production data. Review destructive schema changes as separate releases.

**Remote setup is pending:** no Cloudflare build setting or secret, GitHub branch, hosted database, route or deployment has been changed by this work. Before the eventual merge, set the deploy command to `npm run deploy` and add the build-only migration secret above. Local `./deploy.sh --dry-run` continues to build, test and package without migrations or upload.

References checked: [Cloudflare build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [PostgreSQL advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html), [Astro collections](https://docs.astro.build/en/guides/content-collections/).

## Compact hero and referral route

The home header and signup fill the first viewport, with a compact mobile menu and a side-by-side layout for short landscape windows. Email and optional city share one row. Neither homepage nor referral signup shows a beta-interest checkbox; beta enquiries remain a separate page. Motion controls and the illustrative-photo caption sit directly on the collage. Content can expand naturally for enlarged text or form errors; nothing is clipped to force a fixed height.

`/referral/` uses “found a code” language and requires email, referral code, adult declaration and permission for launch updates. A shareable `?code=...` can prefill an allowlisted code; it is never sent to analytics. This remains encrypted interest registration: codes are recorded, not redeemed or validated for app admission. Existing first-registration preservation still applies.

## Navigation, buttons and referral appearance

Signup and action buttons use label-sized widths without decorative arrows. The shared header returns as a fixed bar after its original position has scrolled away; its normal space is reserved to avoid shifting the page. On the homepage the fixed bar offers About/FAQs section links, with anchor clearance below the header. Every page has a compact mobile menu. Reduced-motion preference disables the header's entrance animation, and keyboard Skip to content remains above the fixed bar.

Only `/referral/` uses the owner-specified gold `#d0b786`, silver `#c1c1c1`, gun grey `#454545` and premium blue `#1e3857`. The header/footer wordmark is tinted using a CSS mask over the existing canonical SVG; the page favicon derives from the master bird path in `branding/source/geometry.json`. Other pages retain their violet identity. No brand geometry was hand-edited.

## Deployment troubleshooting and CLI configuration

`npm run deploy` detects Workers Builds automatically: on Cloudflare main it runs migrations then uploads; locally it runs build, tests and dry-run packaging. `npm run release` remains a compatible explicit CI entry point. Migration failures now report a safe error category/code without printing database URLs, passwords or raw SQL errors.

Workers Builds settings are separate from Wrangler runtime configuration. Wrangler 4.151.1 has no command to configure the Git connection, build/deploy commands or build-only secrets. Configure these once under Worker Settings → Builds:

- Build command: `npm run build && npm test` (Workers Builds already installs dependencies).
- Deploy command: `npm run deploy`.
- Production branch: `main`; previews disabled.
- Build variable: `NODE_VERSION=22.22.0`.
- Build secret: `MIGRATION_DATABASE_URL`, administrator session connection on 5432.

Runtime secrets can be configured interactively with:

```sh
npx wrangler secret put DATABASE_URL --name swoovr-com-web
npx wrangler secret put WAITLIST_DEDUPE_KEY --name swoovr-com-web
npx wrangler secret list --name swoovr-com-web
npx wrangler deployments list --name swoovr-com-web
```

`secret put` publishes a Worker version immediately. Supply the restricted signup connection for `DATABASE_URL` and preserve the existing deduplication key. These commands do not create build secrets; never use them for `MIGRATION_DATABASE_URL`. The public encryption key, route and rate limiter are already defined in wrangler.jsonc.

### Supabase certificate trust for migrations

If a build reports SELF_SIGNED_CERT_IN_CHAIN, download the server root CA certificate from Supabase → Database → Settings → SSL Configuration → Download certificate. In Cloudflare → Worker Settings → Builds → Variables and secrets, add `MIGRATION_DATABASE_CA` containing the complete PEM certificate, including BEGIN/END CERTIFICATE lines. It can be a build variable (the certificate is public) or a build secret. The migration client uses it as a trusted CA while retaining certificate and hostname verification. Do not set NODE_TLS_REJECT_UNAUTHORIZED=0 or disable verification. URL SSL parameters cannot override this migration TLS configuration. No runtime secret is needed for this migration-only setting.

### Bundled Supabase CA (19 October update)

The public Supabase Root 2021 CA is now bundled in `src/database-ca.mjs` for migrations and runtime database clients. No `MIGRATION_DATABASE_CA` setting is required for this Supabase deployment. An optional build CA value can still extend migration trust for other database providers. The bundled certificate was verified against the actual production pooler's presented chain without database credentials. TLS verification remains enabled. The root expires 26 April 2031 and must be replaced when Supabase rotates its CA. This supersedes the manual certificate setup above.
