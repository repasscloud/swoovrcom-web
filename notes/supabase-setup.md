# Supabase setup for Swoovr

18 October 2026. Current corporate-site implementation supersedes the copied notification-only plan.

## 1. Create the project

Use a dedicated Swoovr project and choose the Sydney/Australia region if offered and appropriate for your organisation. Keep the database password in your password manager, enable MFA for dashboard administrators, and review backups for the chosen plan. Region selection alone does not guarantee every provider operation occurs in Australia.

Choose **Data API: No**, **automatically expose new tables: No**, **automatic RLS: Yes**. No public database reads or writes are needed. If the dashboard hides the exposure option when Data API is off, leave it off. Our migration explicitly enables RLS, including for SQL-created tables, rather than relying on dashboard defaults.

References: [Supabase data security](https://supabase.com/docs/guides/database/secure-data), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 2. Apply schema once

In the project's SQL editor, run `supabase/migrations/202610180001_waitlist.sql` from this repository as the project database administrator. It creates a private schema, encrypted signup table, unique email fingerprint and random sharing codes, plus an insert-only `swoovr_signup` login role. It deliberately provides no SELECT/UPDATE/DELETE permission to the website role. Do not rerun a successful migration; use a new migration for changes.

Set the restricted role's password separately in a private SQL editor session:

```sql
alter role swoovr_signup password 'A_NEW_LONG_RANDOM_PASSWORD';
```

Replace the placeholder privately. Never commit the real password or use the project admin role in the website. A custom role still needs RLS policies; ours has an insert policy only. The private schema is not intended to be an exposed API schema even if Data API is enabled later.

## 3. Configure the database secret

In Supabase's Connect panel, select **Transaction pooler** and copy the exact host, project reference and port (normally 6543). Change the username from `postgres.PROJECT_REF` to `swoovr_signup.PROJECT_REF` and use the restricted role password. URL-encode the password. No named prepared statements are used.

```text
postgresql://swoovr_signup.PROJECT_REF:ENCODED_PASSWORD@EXACT_POOLER_HOST:6543/postgres
```

Save this as the runtime **secret** `DATABASE_URL` on the dedicated Cloudflare Worker. Do not add `sslmode` URL parameters: the implementation explicitly validates TLS certificates. Do not turn off certificate validation to resolve a connection problem.

Generate `WAITLIST_DEDUPE_KEY` once (`openssl rand -hex 32`), store it as a runtime secret and back it up. Do not use the database password as this key. Keep the configured RSA public key matched to an offline private key. A public key alone cannot recover records; verify your backup before production signups. The existing `npm run key:setup` helper can create a dedicated pair; it writes the private key outside this checkout.

Only public encryption material belongs in `wrangler.jsonc`. No secret is needed at Astro build time. No Supabase API key is required. This uses SQL, not Supabase's HTTP Data API.

## 4. Connect GitHub and Cloudflare

Create/select **swoovr-com-web** under Cloudflare Workers & Pages, then connect the GitHub repository `repasscloud/swoovrcom-web` using Workers Builds. Use `main` as production branch, repository root as root directory and Node 22.12+.

- Build command: `npm ci && npm run build && npm test`
- Deploy command: `npx wrangler deploy`
- Runtime secrets: `DATABASE_URL`, `WAITLIST_DEDUPE_KEY`
- Runtime public key: existing `WAITLIST_PUBLIC_KEY` in the checked-in configuration
- Preview/non-production deploys: disable, because this configuration owns the production hostname route

Cloudflare's Git integration runs the deploy command after build checks. Do not use `npm run deploy` here: that local helper only verifies packaging. Do not publish just `dist` to Pages: the signup API would be absent.

Move only the corporate hostname route to the new Worker. The old shared Worker currently owns it; resolve that ownership during cutover. This checkout cannot safely remove routes from an unrelated Worker. Confirm that only `swoovr.com/*` belongs to this deployment, and leave application routing in its original project. No cutover, DNS change, remote configuration or production deployment has been performed by this code change.

Cloudflare reference: [Workers Builds Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/).

## 5. Retention and requests

The record expiry is 12 months after signup. Enable the `pg_cron` extension through Supabase's Extensions dashboard if available for your project, then schedule a daily deletion as an administrator:

```sql
select cron.schedule('swoovr-expired-signups', '17 3 * * *',
  $$delete from private.signups where expires_at <= now()$$);
```

Check the job actually runs; an expiry column alone does not delete anything. If scheduling is unavailable, establish an equivalent daily administrative deletion before accepting live signups. Backup retention is managed separately under your plan/provider policy.

For an authenticated removal or correction request, use the admin account and the same email fingerprint algorithm in `src/signup-crypto.mjs` with the protected dedupe key. Deletion removes the row; withdrawal can instead set `marketing_state='unsubscribed'`. Suppressed/unsubscribed rows must never be selected for a future campaign. The website role cannot reverse this state.

## 6. Verify before cutover

Make a synthetic submission on the deployed corporate hostname, inspect the stored ciphertext with an admin account, and decrypt it offline. Confirm optional referral text is inside the ciphertext and no readable email/city is stored. Repeat the same email: exactly one row, same internal referral code and original attribution. Suppress that record, submit again and confirm it stays suppressed. Remove the synthetic record afterwards.

Confirm database/browser public access is denied; only the restricted server credential can insert. Confirm a bad DB connection gives a visible form error and does not say registered. Check mobile/keyboard behaviour, analytics refusal, canonical URLs, route ownership, retention job and deployed privacy text.

Before email invitations or referral campaigns, add tested email confirmation, unsubscribe/suppression, send-time filtering and delivery records. Sharing codes are not beta invitations. No campaign, reward or access guarantee is implemented in this slice.
