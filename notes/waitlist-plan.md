# Swoovr waitlist implementation plan

Approved in chat on 17 October 2026: encrypted notifications, privacy controls, a product notice, and manual Worker deployment.

Architecture: retain the static Astro site; route /api/* to a small Worker. Encrypt validated email and consent metadata using RSA-OAEP SHA-256, then await MailerSend acceptance. Keep the private key outside the repository. No signup database. The Swoovr Google Analytics IDs are G-CNTV4X01CN for swoovr.app and G-4RR4HKDZVP for swoovr.com; do not reuse the corporate property.

1. Write endpoint tests: cross-origin, invalid/oversized input, throttling, missing configuration, provider errors and suppression, fixed notification routing, and OpenSSL decryption. Run failing tests, then implement src/worker.mjs.
2. Replace the coming-soon badge with an accessible form; add consent controls and a privacy notice. Verify desktop/mobile layout, keyboard flow and analytics consent.
3. Replace deploy.sh with manual Wrangler deployment; document secrets, key backup/decryption, provider acceptance limits and Pages domain migration. Build, test, dry-run and deploy when credentials allow.

Review focus: never log email or tokens; never report success on provider rejection; no analytics before consent or after revocation; no broken API fallback into static HTML; private key must never enter dist or Git.

## Verification and delivery

- Endpoint tests and OpenSSL decryption pass; synthetic local and production notifications accepted by MailerSend. Inbox delivery is not independently verified.
- Worker deployed on swoovr.app/* and swoovr.com/*; both domains serve the new UI, privacy notice and expected JSON API errors.
- Pages remains rollback infrastructure because current OAuth lacks DNS access. No Pages releases or Git integration were added.
- Independent review found stale README and the need to document GA Enhanced measurement settings; both addressed. Consent regression test exposed a deny-then-allow disable flag; fixed and tested.
- GA dashboard Enhanced measurement settings require owner review; source code alone cannot verify them.

Final deployment: Worker version 9751d275-0fb0-4f6e-9a53-6f0ae8e6d571. Both hostname mappings verified in production browser after consent. No Google tag before consent or after withdrawal. 13 tests pass, Astro build and Wrangler packaging pass. Key helper verified against the actual configured public/private pair. Private key is mode 0600 outside repository. Source photo deletion preserved and excluded from the implementation commit.
