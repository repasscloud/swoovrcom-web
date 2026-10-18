begin;
create table private.enquiries (
  id uuid primary key,
  kind text not null check (kind in ('contact','beta')),
  encrypted_payload text not null check (encrypted_payload like 'SWOOVR2:%'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months')
);
revoke all on private.enquiries from public, anon, authenticated;
alter table private.enquiries enable row level security;
alter table private.enquiries force row level security;
grant insert (id, kind, encrypted_payload) on private.enquiries to swoovr_signup;
create policy enquiry_insert on private.enquiries for insert to swoovr_signup
  with check (kind in ('contact','beta'));
-- No browser/Data API exposure; website role cannot read or update messages.
commit;
