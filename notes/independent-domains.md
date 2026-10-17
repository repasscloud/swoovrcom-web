# Independent Swoovr domains

User direction, 17 October 2026: swoovr.app will host the application; swoovr.com is the product website. They must not redirect to or canonicalise one another.

Implementation: retain the current shared waitlist deployment, but use self-canonical/og:url metadata and separate sitemap.xml, sitemap-index.xml and robots.txt per host. Existing analytics and consent storage remain per-host. Worker streams HTML metadata using HTMLRewriter; non-HTML assets pass through. No change to DNS or application form behavior.

Validation: Node endpoint tests, Cloudflare runtime HTMLRewriter tests with both hostnames, static build, Wrangler dry-run, then live GET checks for both hosts without following redirects. Preserve unrelated photo deletion.

Result: 18 tests passed; build and Wrangler packaging passed. Published Worker version f61b3680-5baa-49d9-aea5-ad7c2238d7b9. Live requests on both domains returned 200 without redirects for home, privacy, sitemap.xml, sitemap-index.xml and robots.txt. Home/privacy have self-canonical and own-host Open Graph/sitemap URLs; indexing files contain only the serving domain. Waitlist GET continues to return 405. Independent review found no blocking issues.
