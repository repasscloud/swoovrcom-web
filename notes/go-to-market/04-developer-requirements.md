# K. Swoovr developer requirements for pre-launch growth

> Implementation update, 18 October 2026: the corporate website now has a PostgreSQL signup implementation prepared locally. Descriptions of the old email-only/current shared infrastructure below are the earlier research snapshot. See [setup](../supabase-setup.md) and the repository README for the current contract and deployment status.
Prepared 18 October 2026. **Proposed requirements for review; no implementation is included.** [Pack index](README.md).

## Intent and scope

Turn consenting launch interest into a confirmed, city-qualified audience, supported beta invitations and measurable activation. Preserve the distinction between recognition, access, verification and payment. Start with the smallest system that provides trustworthy consent/suppression and local qualification; referrals and entitlement automation follow only when needed.

Marketing requirements specify the outcome. The implementation defaults below are recommendations, not approved vendor choices or a claim that the future application architecture is known. No new provider/API integration, collection or deployed service was created for this report.

## Current contract and gap

**CONFIRMED from source:** `POST /api/waitlist` accepts `email`, `consent:true` and an optional honeypot. It validates same-origin JSON, size and email, uses approximate IP limiting, encrypts the submission and sends a fixed internal MailerSend notification. A 202 response represents provider acceptance or silent honeypot discard. It is not a confirmed subscriber, an ownership check or inbox-delivery receipt.

The existing reusable interface is [api/waitlist.openapi.json](../../api/waitlist.openapi.json). Keep it authoritative for current behaviour. Before implementation, agree the replacement/evolution contract and update that artifact or add a versioned successor, with runnable assertions for the states and failures below. Do not silently reinterpret the current `consent` flag or current 202 response.

There is no current database or automatic visitor email/campaign delivery. The present private-key/mailbox model requires manual authorised handling. Adding city qualification, reliable suppression, deduplication and invitations needs an explicit storage and mailing decision, privacy-notice change and migration plan. It cannot be obtained by adding a few fields to the homepage alone.

## Incremental delivery

| Priority | Marketing requirement | Technical outcome / verification |
| --- | --- | --- |
| P0 | Know whose address is confirmed and which city they selected | Subscriber state, confirmation, scoped consent, idempotent dedupe and city qualification |
| P0 | Stop messages on withdrawal and respect retention | Send-time suppression, simple unsubscribe, deletion process and automated retention jobs |
| P0 | Know whether recruitment works | Unique operational counters with clear definitions and privacy-safe source attribution |
| P1 | Admit supported groups responsibly | Private applications, transparent eligibility, invitations, staffing/wave limits and audit |
| P1 | Recognise qualifying founders | Independent recognition record, optional display, versioned terms and appealable revocation |
| P2 | Let people share responsibly | Separate share/referral identifiers, qualified attribution, abuse checks and capped rewards |
| P2 | Automate finite benefits | Entitlement grant/revoke/expiry, idempotency and billing separation |
| P3 | Repeat in another city | Configurable city programme/wave rules and coverage reporting; no automatic expansion trigger |

## Data collected in stages

| Stage | Necessary data | Optional / restricted data | Excluded at this stage |
| --- | --- | --- | --- |
| Initial signup | Email, adult declaration, city/metro region, specific marketing consent, wording/notice versions and timestamps | Allowlisted campaign code, beta-interest checkbox | Exact address, date of birth, ID/photo, orientation, gender, relationship history, contacts |
| Confirmation | Token-derived subscriber reference, verification timestamp | Self-service city correction | Password requirement solely to receive updates |
| Beta application | Supported device/OS, current local availability, willingness to test, application permission | Approximate area/travel comfort, broad age band; private preferences only where genuinely needed to plan reciprocal participation with explicit consent and skip/explanation options | Public applicant directory; ad-platform lead-form collection of intimate preferences |
| App onboarding | Only data justified by actual matching, eligibility and safety design | Optional verification where designed; accessible alternatives and clear limitation | Reuse of waitlist consent as blanket app/profile consent |
| Reporting | Aggregated source/city/state/wave/cohort events | Restricted authorised analysis of relevant preferences | Message contents, identity documents or sensitive traits in marketing analytics |

A “qualified beta candidate” is confirmed email + self-declared 18+ + Adelaide interest + supported device + willingness in the proposed test period. Self-declaration does not verify age, residence or identity. Actual app eligibility/age assurance is a separate product decision before admission. Avoid gathering sensitive preferences early simply because segmentation is convenient.

## Logical records and independent states

Use stable internal IDs. Minimum logical records: subscriber, consent event, campaign source, beta application, invitation, wave, referral attribution, founder recognition, entitlement grant and administrative audit event. These need not be separate physical tables if a chosen system represents them accurately.

Keep independent dimensions:

- Email ownership: unconfirmed / confirmed.
- Marketing: opted-in / unsubscribed / suppressed / expired. A complaint or bounce can suppress delivery without deleting product membership.
- Application: not applied / submitted / needs information / eligible / deferred / declined / withdrawn.
- Invitation: issued / accepted / expired / revoked; delivery status tracked separately.
- Account: not created / eligible / activated / suspended / deleted, owned by the future app.
- Recognition: none / awarded / revoked, with reason and policy version.
- Entitlement: pending / active / expired / revoked, with start/end and origin; subscription state is separate.

Unsubscribing must not delete a founder badge or cancel an app account automatically. Deleting an account must not create a permanent public founder record. Revoking an abused referral reward does not automatically establish a safety violation. These distinctions prevent marketing workflows from mutating unrelated rights.

## Consent, delivery and retention

Store affirmative purpose/channel consent with exact wording version, notice version, source and UTC timestamp. Keep adult declaration separate from marketing consent. Optional analytics is independent and must not gate signup. Do not default to partner promotions or cross-brand marketing.

Recommended double opt-in is an evidence/abuse-control choice, not a claim that Australian law universally mandates it. Send a minimal functional confirmation without upselling. Rate-limit sends by destination and network, avoid account enumeration and do not use a confirmation message to pursue an unsolicited promotional campaign.

All marketing sends check current consent and suppression **at send time**, including already queued reminders. Use a verified authenticated sender with monitored replies and configured domain authentication. Process complaints, hard bounces and unsubscribes promptly. Keep provider acceptance, delivered/bounced status and user action distinct. Never display “confirmed” merely because a provider accepted a send.

Offer an unsubscribe link requiring no login, extra profile details or payment. Handle link scanners safely: GET should display a neutral action/status page; an intentional POST or standards-compatible one-click unsubscribe action performs suppression idempotently. There must be no confirmation-email requirement to leave. Replies asking to leave must be processed too. Immediate suppression is the default, within ACMA's five-working-day requirement. [ACMA](https://www.acma.gov.au/avoid-sending-spam).

**Retention defaults for review:** unconfirmed requests expire after seven days; declined/withdrawn research details deleted within 30 days unless a narrower documented need applies; invitation secrets cease to be usable on expiry/revocation; unused optional application details reviewed after 90 days. Preserve the current published waitlist limit: earlier of completed launch communications, withdrawal or 12 months from signup, unless new appropriate permission is obtained. All periods are proposed operating limits, not statutory retention periods.

Keep only the minimum restricted suppression/audit record required to prevent re-enrolment and demonstrate relevant obligations. A keyed email fingerprint is still pseudonymous personal information, not anonymous data. Define its lawful purpose, access and retention, including how deletion requests and backup expiry are handled; do not use “audit” as indefinite retention of profiles.

## Legacy notification migration

1. Reconcile original consent wording, timestamps, retention and prior removal requests before import. Do not print decrypted records in logs or commit exports.
2. Authorised staff decrypt only in the existing secure process. Inventory duplicates and deletion/suppression obligations; do not upload plaintext to a newly chosen service until processing terms and notices are reviewed.
3. Import as **legacy unconfirmed**, not confirmed email ownership. Preserve original consent purpose/version and original expiry. Do not infer city or beta eligibility.
4. Any ownership/updated-interest message must fit the existing permission and legal review; no unsolicited “permission request” is a loophole for an address without valid consent. Explain the actual current status and optional next step.
5. Reconcile suppression before any send; a retry/import must never reactivate an opted-out person. Log aggregate import outcomes and restricted record provenance.
6. Verify deletion/removal across the active system, mailbox and temporary exports under the documented retention process. Backups follow a defined expiry. Keep required encryption keys securely available for retained ciphertext.

## Referral and invitation rules

| Concern | Marketing requirement | Proposed implementation default |
| --- | --- | --- |
| Public share code | Easy to share without exposing the person | Cryptographically random opaque ID, at least 96 bits of entropy, URL-safe; optional readable prefix not carrying identity/city data |
| Private invitation | Controlled supported access | Separate random ≥128-bit secret; hash at rest, one use, bound to confirmed recipient, wave and supported eligibility; seven-day default expiry |
| Confirmation token | Demonstrate mailbox control | Random ≥128-bit secret, hashed, short-lived (24-hour default), single use, rate-limited resend; no subscriber status leaked on failure |
| Redemption | No double entry or stock overrun | Atomic consume/claim with unique constraints; idempotency key and race-condition test; invitation alone never bypasses app safety eligibility |
| Referral attribution | Give one fair credit | Record original qualifying link, obtain user confirmation at signup, lock first successful attribution; no last-click overwrite after signup |
| Qualified referral | Count real, consenting interest | Confirmed unique address, adult declaration and eligible city; provisional seven-day hold. Actual person authenticity is not proven by email |
| Access vs referral | Share without social gatekeeping | Referral link cannot redeem beta access or guarantee earlier invitation; open application route retained |
| Geography | Admit where the product can help | Self-reported metro/local availability plus private app settings; no IP/geofence-only residence proof or precise GPS for waitlist |
| Limits | Prevent uncontrolled growth/support load | Configurable per-wave issue/redeem cap; per-recipient one valid invitation; configurable referral-reward caps |
| Expiry and extension | Fairness without fake urgency | Explain real expiry; authorised extension/reissue invalidates previous secret and preserves waitlist eligibility |
| Revocation | Stop abuse and errors | Revoke a token, campaign or reward with reason, actor, time and appeal/support route; no public shaming |
| Privacy | Avoid exposing relationships/intentions | Referrer sees aggregate credits only; never names, identities, preferences, activation detail or who joined |

Use URL fragments or carefully handled tokens/routes with `Referrer-Policy: no-referrer`, no-store pages and token-redacted application/edge logs where controllable. Do not include third-party tags on confirmation/invite pages. Consume and clear secrets deliberately; do not let link-preview scanners create an account or redeem an invitation through GET. Threat-model infrastructure logs, screenshots and forwarded mail as well as application code.

Dedupe conservatively: validate and normalise domains; preserve meaningful local-part differences and avoid universal plus-address/dot stripping. Do not block households/campus networks merely for a shared IP. Combine limited abuse signals, destination throttling, provisional benefits and review; avoid invasive persistent fingerprinting. Add a challenge only when risk justifies friction, with an accessible alternative. Fraud controls reduce abuse; they do not prove everyone is genuine.

## Founder recognition and finite entitlement rules

Award recognition only under the published programme version: eligible Adelaide beta account, activation within the stated period, one qualifying contribution with accessible alternatives. Participation may be critical feedback. No paid-subscription or referral condition. Keep award evidence minimal; do not retain an interview transcript just to justify a badge.

Recognition fields: programme/city, awarded_at, criteria_version, display_preference and any narrowly justified revoked_at/reason. No expiry while the account remains eligible/existing. Subscription cancellation and inactivity do not revoke recognition.

A proposed Premium grant is a separate record: benefit type, grant reason, eligible plan/features, duration, start condition, issued_at and expiry. Only announce after finance approval. Thirty days begins on explicit redemption once supported Premium features are available; publish a reasonable redemption window before enrolment, and do not consume grant time during unavailable service. No card or automatic paid conversion. Referral bonus cap is 14 days per person, if that experiment is later approved; stacking/maximum expiry rules must be published before use.

Account termination or proven fraudulent award can lead to recognition revocation under published terms and an appeal. Negative feedback, unsubscribe and nonpayment cannot. Store/payment-platform rules must be reviewed before shipping promotional entitlements; the badge itself is not a paid plan.

## Founder recognition after account deletion

The imported draft suggests a “previously proposed privacy-preserving recovery-token model.” No approved model was found in the supplied materials. Treat this as an unresolved product/privacy/security question, not an existing capability. [Source reconciliation](05-other-draft-review.md).

**DEFAULT for the present plan:** recognition persists without payment or activity while the account exists; account deletion removes the public account/recognition display. No automatic recovery promise is made. Explain the consequence before offering the programme. This must not obstruct deletion or require someone to keep a dating profile just to preserve a benefit they were promised under different terms.

**Optional design to assess before any promise:** let an eligible member deliberately elect to retain a private claim to recognition, separately from deleting their app profile. A user-held, cryptographically authenticated receipt could support a claim on a fresh eligible account. The receipt represents recognition only—not authentication into an old account, identity verification, beta access or paid subscription rights. Its integrity does not prove the person holding it is the original member, and a digital signature does not encrypt its contents.

A scoped design must settle:

- **Data and deletion:** define exactly what, if anything, remains after deletion, why it is needed, its lawful basis, retention, access and withdrawal handling. No profile, messages, photos, preferences or location history is retained for badge recovery. A stable opaque identifier, hash or receipt can still be linkable/personal information; do not call it anonymous by default.
- **Original-holder evidence:** possession of a transferable token or a newly controlled email alone cannot reliably prove the same person. Decide the acceptable transfer/fraud risk and least intrusive additional evidence; do not introduce identity-document retention merely for a badge. If non-transferability cannot be supported, do not promise it.
- **One valid claim:** atomically redeem/rotate any recoverable claim so one award cannot populate multiple live accounts. Define lost/stolen receipts, simultaneous claims and an appeal path. Do not silently recreate the deleted account's identifiers or data.
- **Safety:** an award claim never bypasses current app eligibility, sanctions or a documented safety review. Retain safety-related records only under their separately justified policy, not under an unlimited “founder recovery” exception.
- **Key lifecycle:** identify signing/verification ownership, version/key identifiers, secure key custody, rotation, compromise response and service retirement. “Permanent” cannot mean an undocumented dependency on one unbacked key. Do not reuse the existing waitlist encryption key for this purpose.
- **Consumer terms:** state what survives deletion, whether recovery is available, evidence needed, limitations and recourse before enrolment. If unavailable, say so. A lost token does not justify fabricating historical eligibility.

Before adopting recovery, test that old content remains deleted, altered/replayed/stolen/duplicate claims cannot create unauthorised awards, a banned account cannot bypass review, key rotation/compromise is handled, and data-removal/withdrawal instructions match actual retained records. Defer this optional feature if the support and privacy cost exceeds the recognition benefit. These are design requirements, not a shipped recovery mechanism.

## Measurement and administration

Operational counts come from durable state transitions and deduplicated events. Proposed events: signup_requested, email_confirmed, city_selected, beta_applied, invite_issued, invite_accepted, account_activated, profile_usable, verification_started/completed, reciprocal_conversation_started, recognition_awarded, entitlement_redeemed/expired and marketing_suppressed. Use fixed documented windows and exclude staff/test accounts.

Internal event IDs may be pseudonymous personal information and need restricted access. Third-party marketing analytics must receive none of the email, exact location, matching preferences, verification details, message contents or invite/referral-person secrets. Keep the existing consent gating and separate-host consent design. If using campaign codes, validate against an allowlist, discard arbitrary query text and prohibit user identifiers in codes. Review how capture/retention interacts with the published analytics choices before implementation.

Dashboard must show city/source, confirmation, application, invite delivery/redemption/activation, suppression, duplicates, wave capacity, cost scope and matured retention cohorts. Add the per-person reciprocal eligible-active-option distribution from the app, with separately authorised access and small-cell suppression. Report inability to measure a group rather than silently excluding it. Counts must not conflate email confirmation with identity verification.

Administration requires role-based access, strong authentication, least privilege, auditable exports and permission to issue/revoke invitations. Marketing should not browse intimate matching preferences or verification artefacts. Large exports, wave changes and bulk sends need preview, count/consent checks and an accountable operator; support a global pause without deleting subscribers. Partner reporting is aggregate only, with a minimum cell size and no per-person attribution disclosure.

## Contract planning for implementation

These are **proposed operations**, not implemented routes or a final API specification:

| Operation | Intended guarantee | Failure/compatibility concern |
| --- | --- | --- |
| Request subscription | Generic accepted/pending result; no address enumeration; no duplicate confirmation burst | Provider failure vs durable queue acceptance must have explicit semantics; existing 202 remains documented until migration |
| Confirm ownership | One-time intentional action, records confirmed_at | Expired/replayed/scanner-followed link never creates unintended access |
| Update city/preferences | Authorised self-service and explicit consent history | No arbitrary subscriber editing with a public ID |
| Unsubscribe | Immediate idempotent suppression without login | Queue/import cannot re-enable; safe public response |
| Apply for beta | Private consented application, no admission promise | Strict data minimisation; purpose-specific access |
| Issue/redeem invitation | Authorised issue, recipient binding, atomic limit/expiry enforcement | Duplicate concurrent redemption, forwarded token, revoked wave |
| Award/redeem benefit | Versioned eligibility, bounded grant and independent recognition | Subscription changes cannot erase badge; retries cannot stack grants |
| Admin reporting/export | Scoped, audited, privacy-protected | Small-cell disclosure and unauthorised bulk access |

Preserve and evolve the existing OpenAPI contract once decisions are approved. Add a Postman collection if it will support repeatable stateful acceptance checks; do not maintain a second contract just for appearances. Keep environments/secrets outside source and distinguish local/mocked checks from actual mail delivery and app integration. No Postman workspace setup or publication is required for this research deliverable.

## Acceptance cases before marketing depends on the system

1. Same valid request retried concurrently produces one logical pending subscriber and bounded confirmation sends.
2. Unconfirmed, duplicate and unknown addresses produce non-enumerating public responses.
3. Invalid, oversized, cross-origin and throttled requests behave as documented; secrets and personal fields do not appear in logs.
4. Confirmation requires intended action; expired/replayed links and scanners cannot activate subscription/access.
5. Wrong recipient, revoked/expired invite and simultaneous redemption cannot bypass limits or eligibility.
6. Unsubscribe immediately suppresses queued campaigns and survives a subsequent import, retry or referral click; resubscription needs a fresh intentional consent flow.
7. City/application edits cannot change another subscriber or infer sensitive public membership.
8. Referrer sees no referred person's identity or activity; self/duplicate referral cases do not automatically earn benefits; legitimate shared households can appeal.
9. Founder recognition survives subscription cancellation and inactivity; optional display works; termination/fraud revocation is reasoned and appealable.
10. Finite grants redeem/expire once, do not charge automatically and do not stack beyond published caps.
11. Retention/deletion removes active personal data on schedule and handles backups/mailbox/exports according to policy; suppression is minimised and documented.
12. No analytics before consent or after withdrawal; no sensitive values, arbitrary URL parameters or tokens in third-party events or referrers.
13. Source/city/wave totals reconcile with durable subscriber states, unique counts and test-account exclusions; consented-only visitor scope is labelled.
14. Invitation/support pause works and denies new admission safely while existing people can reach help.
15. Supported beta journeys, reciprocal discovery permissions, block/report/escalation and app-store requirements pass in the real app before public claims.
16. Any adopted founder-recovery flow passes the dedicated deletion, claim, safety and key-lifecycle cases above; until then no restoration promise or automatic re-award is shipped.
17. Real confirmation delivery, suppression and inbox behaviour are tested with controlled addresses after provider selection. Mocked HTTP success is not evidence of inbox delivery.

## Implementation decisions still open

Storage/CRM choice, outbound marketing sender, encryption/access/key management, app identity integration, verification providers, app-platform entitlement integration, exact legal data-role/transfer requirements and support staffing are not specified by the current website. Resolve them through scoped design before coding or purchasing. Do not expand the existing RSA-encrypted notification payload indefinitely; direct RSA has a size limit. A future durable system needs an appropriate data-at-rest/key-management design rather than assuming the current mailbox transport is a CRM.
