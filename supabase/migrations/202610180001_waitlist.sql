begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
-- Set a strong password separately; never save it in this migration.
create role swoovr_signup login nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
grant usage on schema private to swoovr_signup;
create table private.signups (
  id uuid primary key,
  email_hash text not null unique check (email_hash ~ '^[a-f0-9]{64}$'),
  encrypted_payload text not null check (encrypted_payload like 'SWOOVR2:%'),
  referral_code text not null unique check (referral_code ~ '^[a-f0-9]{32}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months'),
  marketing_state text not null default 'opted_in' check (marketing_state in ('opted_in','suppressed','unsubscribed')),
  email_confirmed_at timestamptz,
  referral_sent_at timestamptz
);
revoke all on private.signups from public, anon, authenticated;
alter table private.signups enable row level security;
alter table private.signups force row level security;
grant insert (id, email_hash, encrypted_payload, referral_code) on private.signups to swoovr_signup;
create policy signup_insert on private.signups for insert to swoovr_signup
  with check (marketing_state = 'opted_in' and email_confirmed_at is null and referral_sent_at is null);
-- No SELECT/UPDATE/DELETE policy or grants for the website role.
-- ON CONFLICT DO NOTHING uses the unique index without reading existing rows.
commit;
