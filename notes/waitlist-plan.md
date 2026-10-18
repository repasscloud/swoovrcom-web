# Current waitlist implementation

18 October 2026: the copied notification-only plan is superseded by encrypted PostgreSQL storage. See [Supabase setup](supabase-setup.md), [website identity](website-brand.md), the repository README and `api/waitlist.openapi.json` version 2.

The site uses one corporate hostname, one early-updates signup and optional city, beta-interest and referral-code fields. Referral codes are stored without validation or access effects; internal personal share codes are reserved but not emailed. Campaign delivery and email ownership confirmation are future work.

The original encrypted mailbox archive is not automatically imported. Do not reset original consent dates or suppression during a future authorised migration.
