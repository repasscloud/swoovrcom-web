# Swoovr corporate website

Corporate/product website for **https://swoovr.com**, operated by RePass Cloud Pty Ltd. Astro static pages plus the dedicated `swoovr-com-web` Cloudflare Worker. Node.js 22.12+.

## Local development

```sh
npm ci
npm run dev                  # static site, port 4321; signup API needs Worker
npm run dev:worker           # build plus Worker, port 8787
npm test
./deploy.sh --dry-run        # build, tests and packaging only; never uploads
```

Use `.env.example` as the setup checklist and keep real values in the ignored `.env` file. Local files do not upload secrets to Cloudflare; set `DATABASE_URL` and `WAITLIST_DEDUPE_KEY` as Worker runtime secrets separately. For local Worker testing, use `.dev.vars.example`: an existing `.dev.vars` takes precedence over `.env`. The public key and rate-limit binding remain in `wrangler.jsonc`.

Keep `.dev.vars` ignored. Use `.dev.vars.example` for the new database configuration; copied MailerSend credentials are no longer used and can be removed. For static preview the form cannot save data. Worker development requires `LOCAL_DEVELOPMENT=true`. Missing database secrets fail closed.

## Supabase and GitHub setup

Follow [the setup guide](notes/supabase-setup.md). Project creation choices:

| Setting | Choice |
| --- | --- |
| Enable Data API | **No** |
| Automatically expose new tables | **No** |
| Enable automatic RLS | **Yes** |

The Worker connects to PostgreSQL through Supabase's transaction pooler using a restricted insert-only role. No Supabase browser SDK, publishable key, service role key or public read policy is required.

Production releases come from Cloudflare **Workers Builds**, linked to `repasscloud/swoovrcom-web`, production branch `main`. Build: `npm ci && npm run build && npm test`. Deploy: `npx wrangler deploy`. The local deploy helper does not upload or read local secrets. Keep preview deployments disabled because this Worker owns production routes.

Only `swoovr.com/*` is configured. This is a distinct Worker name: never attach this repository's build to the old shared Worker. The owner must move the corporate hostname route from that Worker to the new one without changing the original application's route or deleting its Worker. Workers Builds must be used, rather than a static-only Pages build, because `/api/waitlist` runs server code.

## Signup guarantees and limits

`POST /api/waitlist` contract: [OpenAPI](api/waitlist.openapi.json).

- Required: email, separate 18+ declaration and launch-update consent. Optional: city, beta-interest and submitted referral code. No sensitive dating/profile fields.
- The Worker encrypts personal fields using a fresh AES-256-GCM key, wrapped using RSA-OAEP-SHA256 (`SWOOVR2`). It stores only ciphertext, a secret-keyed email fingerprint, random identifiers and operational timestamps/states.
- The private RSA key stays offline. The website cannot decrypt records. Keep the existing matching private key safe before using the configured public key, or generate a new dedicated pair using `npm run key:setup` and back it up. Never commit keys.
- The email HMAC key must be random, stable and backed up; changing it breaks duplicate detection. The lowercased, trimmed email defines a duplicate. No provider-specific alias normalisation.
- Duplicate signups preserve the original record, referral code, attribution and suppression. This prevents anonymous submissions from changing a subscriber's record or restoring withdrawn consent. Corrections require authorised handling.
- A personal share code is reserved internally, but never returned or emailed. Submitted friend codes are stored inside the encrypted record without validation, lookup, rewards or access effects.
- A 202 response means database acceptance/existing registration, or silent honeypot discard. It is not email ownership confirmation. No email is currently sent. Database failures return an error.
- Approximate IP rate limiting and a honeypot are present. Monitor abuse before advertising; add stronger bot controls if needed.

## Authorised handling

Read records using an admin account in a private environment. Pipe one `encrypted_payload` to `npm run waitlist:decrypt -- /absolute/path/private.pem`. It also supports legacy `SWOOVR1` records. Decrypted output contains personal information: do not paste it into logs, source files, analytics or public issues.

The new database starts empty. Old encrypted mailbox records are not imported automatically. Any authorised migration must decrypt privately, preserve original consent dates and expiry/suppression, re-encrypt and deduplicate; do not infer fresh consent from import time.

Before sending any campaigns: implement and test email ownership confirmation, unsubscribe/suppression, send-time consent/expiry checks and a delivery ledger. Honour deletion requests manually in the meantime; the setup guide includes retention scheduling. Future rewards, beta invitations and founding benefits need separate terms and states.

## Branding and measurement

The existing outlined logo and bird are retained. The brand source is `branding/source/geometry.json` and `branding/source/themes.json`; regenerate artwork from those rather than editing derived SVG paths. [Website brand rules](notes/website-brand.md) describe the implemented palette, typography and content direction.

Only the corporate Google Analytics stream `G-4RR4HKDZVP` is configured. Tags load after affirmative analytics consent; Global Privacy Control keeps them off. Disable Enhanced measurement (including forms and site search) in the GA dashboard. Query strings, fragments, email, form fields and referral codes must never reach analytics. This slice does not add campaign attribution or conversion events; no confirmed signup metric exists yet.

## Verification

Local unit/runtime tests cover API validation, encryption/decryption, failure handling, indexing and analytics consent. Run `npm run build` before `npm test`. Live Supabase, domain routing, GitHub build configuration and email campaigns require separate integration verification; local tests do not prove them.
