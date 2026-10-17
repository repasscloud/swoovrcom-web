# Swoovr waitlist website

Astro landing site and a Cloudflare Worker, using Node.js 22.12+ and npm. The Worker `swoovr-web` serves **swoovr.app** and **swoovr.com**, including static assets and `POST /api/waitlist`. Releases are manual Wrangler uploads from this checkout. There is no Git publishing integration.

## Local development

```sh
npm ci
cp -n .dev.vars.example .dev.vars
# Set MAILERSEND_API_KEY in .dev.vars using your editor.
npm run dev:worker
```

Open **http://127.0.0.1:8787**. `.dev.vars` is ignored by Git. Its `LOCAL_DEVELOPMENT=true` permits only the two localhost origins on port 8787; the production deployment helper uploads only `MAILERSEND_API_KEY`, never this local flag. Local form submissions with a real MailerSend token send real internal notifications. Use a synthetic address for testing.

`./local.sh` still runs the Astro visual preview (normally port 4321). The API is available only in the Worker preview above. `npm run preview` is also static-only.

## Notification flow

The form collects an email address and permission for Swoovr launch updates from an adult. The Worker validates the request, checks the same-origin header, applies an approximate per-IP limit of three submissions per minute per Cloudflare location, and discards populated honeypots. These measures reduce simple abuse; Origin headers and honeypots are not proof that a visitor is human. There is no database, email ownership verification or automatic launch mailing system.

Before calling MailerSend, it encrypts a JSON record containing `email`, `consent` (the wording version `waitlist-2026-10-17`) and `at` (UTC submission time), using RSA-OAEP with SHA-256 and a 4096-bit public key.

Every notification has these fixed fields:

- From: `hello@repasscloud.com`
- To: `swoovr.app@repasscloud.com`
- Subject: `swoovr app waitlist signup`
- Plain-text body: `SWOOVR1:` followed by base64 ciphertext

MailerSend open, click and content tracking are disabled for these messages. No submitted email, request body, ciphertext or token is deliberately logged by the application. MailerSend success requires HTTP 202, an `x-message-id`, no warnings, and no paused-send flag. This proves acceptance for sending, not inbox delivery. Ambiguous network failures can result in duplicates if someone retries.

Encryption protects the submitted address in the notification. It does not prevent spam filtering. Keep the sender domain's SPF/DKIM/DMARC correct and inspect MailerSend delivery results and the internal mailbox's filtering. The sender never becomes the visitor's email address.

## Encryption key and OpenSSL decryption

The production public key is in `wrangler.jsonc`. The private key is **only on this Mac**, outside the repository:

```text
/Users/danijeljw/.config/swoovr/waitlist/private.pem
```

**Back it up securely now. Losing it makes previously received notifications unrecoverable.** Never commit, publish or upload the private key to the Worker. Keep previous private keys when rotating keys. `npm run key:setup` creates a key pair only if none exists and refuses to replace a different configured public key.

Save just the notification body to `notification.txt`, then run:

```sh
npm run --silent waitlist:decrypt < notification.txt
# Or use a different retained key:
node scripts/decrypt-waitlist.mjs /secure/path/private.pem < notification.txt
```

The helper invokes OpenSSL and prints the decrypted JSON. The underlying OpenSSL command, after removing `SWOOVR1:` and base64-decoding the body into `notification.bin`, is:

```sh
openssl pkeyutl -decrypt \
  -inkey "$HOME/.config/swoovr/waitlist/private.pem" \
  -pkeyopt rsa_padding_mode:oaep \
  -pkeyopt rsa_oaep_md:sha256 \
  -pkeyopt rsa_mgf1_md:sha256 \
  -in notification.bin
```

The private key is protected by filesystem permissions rather than a passphrase, so protect the Mac and its backups. Treat decrypted exports and the notification mailbox as personal information. Process removal requests and review mailbox/export retention manually; the site does not automatically delete mailbox messages. The published notice commits to the earlier of launch communication completion, withdrawal, or 12 months after signup. Launch updates must identify the sender and offer an effective way to leave the list. The synthetic local/production test records can be removed from the mailbox.

## Analytics and privacy

The footer includes the RePass Cloud privacy icon and **Your privacy choices** control. The Swoovr notice at `/privacy/` supplements the company policy and describes this website and waitlist only, not the future app.

**The measurement IDs are `G-CNTV4X01CN` for swoovr.app and `G-4RR4HKDZVP` for swoovr.com.** They are configured by hostname in `googleAnalyticsMeasurementIds` in `site.config.json`; changes require rebuilding and deploying. Analytics remains off for each visitor until they allow it. Do not put an API secret there. Turn off **Enhanced measurement** in both GA web data streams (including form interactions and site search), so automatic events do not inspect the waitlist form or URLs. This site sends an explicit page view using a URL with no query string or fragment and a blank referrer; the site emits no custom signup events or email values. Enhanced measurement was confirmed disabled on both tags by the owner on 17 October 2026; this is owner confirmation rather than an independent dashboard check. See [Google's Enhanced measurement settings](https://support.google.com/analytics/answer/9216061?hl=en).

With a valid ID, Google tags load only after explicit analytics consent or a previously saved grant. Denial prevents tag loading; revocation disables analytics, removes known GA cookies and reloads to unload tags. Global Privacy Control overrides a stored grant. The preference is stored as `swoovr_privacy_v1` in local storage and applies per origin/browser. If storage is blocked, consent applies only to the current page. Review the notice when the actual analytics configuration changes.

## Build and manually deploy

```sh
npm test
./deploy.sh --build-only
./deploy.sh --dry-run
./deploy.sh
# Equivalent production entry point:
npm run deploy
```

The script installs locked dependencies if needed, tests, builds photos/site, and deploys with project-local Wrangler. Production requires `MAILERSEND_API_KEY` in `.dev.vars`; the deployment helper stages only that secret in a protected temporary file, deploys it with the Worker version, then removes the temporary file. It does not publish local development flags. Existing Wrangler OAuth authentication is supported; otherwise authenticate with `npx --no-install wrangler login` or supply your own `CLOUDFLARE_API_TOKEN` through the environment. Never paste tokens into chat or commit them.

`wrangler.jsonc` pins the account, Worker, assets, public encryption key, rate limiter and domain routes. No Pages deploy command or repo-triggered build is used.

### Domain routing and rollback

Worker routes `swoovr.app/*` and `swoovr.com/*` cover all website/API requests and return Worker static assets; they do not fetch the old Pages origin. Existing DNS and the old `swoovr-landing` Pages deployment are retained as rollback infrastructure. The current OAuth token can manage Worker routes but cannot read/write DNS records, so the live migration uses routes rather than Worker Custom Domains. This is a Worker deployment; Pages receives no new site releases.

To roll back a Worker version, use Wrangler's deployment/rollback commands after checking the target. Removing both Worker routes would reveal the old Pages site, which has no waitlist. Do not remove the old Pages project or DNS until replacing those records with Worker Custom Domains using an appropriately scoped Cloudflare token. A fresh checkout must retain the source photos and the correct public key; it does not need the private key for deployment.

## Independent domain indexing

`swoovr.com` is the product website; `swoovr.app` is reserved for the future application. For now they share the waitlist implementation and Worker, but each remains on its own host with its own canonical URLs, Open Graph URLs, analytics stream and browser consent storage. Neither redirects to the other or declares the other domain canonical.

Each host publishes `/sitemap-index.xml`, linking to its own `/sitemap.xml` with the home and privacy pages. Its `/robots.txt` advertises that host's sitemap index and excludes `/api/` from crawling. Pages link to their own sitemap index in the HTML head. Search engines ultimately decide whether and when to index pages.

The Worker runs before static assets and streams HTML through Cloudflare HTMLRewriter to resolve origin-relative metadata against the serving host. Asset bodies such as images/CSS/JavaScript remain unchanged. Astro has no preferred production `site` domain. When the application is ready, its route can move to a separate app deployment while the product website remains on swoovr.com.

## Photos and checks

Drop JPEG, PNG, WebP, AVIF or TIFF files into `people_pics_random/` (subfolders and case-insensitive extensions supported). Restart the local/build command after changes. Sharp corrects orientation, crops and strips metadata, and produces 480×640 WebP copies under `public/people/`. Originals remain unchanged. Generated photos and `src/data/photos.json` are ignored by Git; retain originals when moving machines. Damaged supported images stop the build.

All photos appear in the shuffled collage. Pause motion stops animation; reduced-motion starts paused. Photos are illustrative and do not represent verified member profiles.

`npm test` covers endpoint validation, throttling, provider failures and suppression, encryption/OpenSSL roundtrip, and consent loading/withdrawal/GPC. `api/waitlist.openapi.json` documents the HTTP contract. Tests with mocked provider responses establish local behavior; live delivery still depends on MailerSend and mailbox acceptance.
