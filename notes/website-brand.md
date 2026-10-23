# Swoovr corporate website identity

Use the existing bird and outlined wordmark, now in ink. Geometry remains in `branding/source/geometry.json`; the black and white palette comes from `swoovr-marketing/design/` and lives in `src/styles/tokens.css`. Use the variables, not new hex values.

| Role | Token | Colour |
| --- | --- | --- |
| Text, primary buttons, focus rings, logo | `--ink` | `#0A0A0A` |
| Hero, header, cards, inputs | `--white` | `#FFFFFF` |
| Footer and alternate bands | `--canvas` | `#FAFAFA` |
| Photo placeholders, hover fills | `--soft` | `#F4F4F4` |
| Secondary text | `--muted` | `#6B6B6B` |
| Dividers (decorative only) | `--line` | `#E5E5E5` |
| Input, checkbox and pill borders (3:1) | `--control` | `#8A8A8A` |
| Text on ink panels | `--on-ink` / `--on-ink-muted` | `#FAFAFA` / `#A3A3A3` |

No violet, lavender or purple-tinted greys. Colour appears only in photos, verification badges (never recoloured: photo `#087CFA`, ID `#00AAA0`, founding `#D4AF37`, staff `#E0115F`, bot `#C0C0C0`), status messages (always paired with words) and the referral page. The old variable names (`--paper`, `--violet`, `--carbon`, `--lavender`) remain as aliases because the referral theme overrides them; `--accent` is the action colour.

Typography: `"Helvetica Neue", Helvetica, Arial, sans-serif`; no external font requests. Large, closely spaced connection headline (weight 600–700, ink); quieter body copy with readable line lengths. Buttons are ink pills; secondary buttons are white with a 1px ink border. Links are ink and underlined. Retain the diagonal photo wall as the recognisable hero element, label stock portraits as illustrative, respect reduced motion and provide a pause control. Content below the hero uses generous split sections, hairline dividers and accessible disclosures rather than a uniform card grid.

**Referral exception.** `/referral/` keeps its navy `#1E3857`, navy deep `#172C45`, champagne gold `#D0B786`, silver `#C1C1C1`, graphite `#454545` and ivory `#F0ECE4` palette, Avenir Next type, gold logo tint and navy/gold favicon. `src/styles/referral.css` maps every shared token back to that palette; add an override there for any new token the page would inherit.

**Motion.** A first-load splash (`src/components/Splash.astro`, about 2.2s, ink; navy and gold on referral) plays once per browser session, skips on click or key, and never shows for reduced motion or without JavaScript. Sections rise 18px into view, the hero lines rise in after the splash, buttons lift 1px on hover and link underlines thicken. Referral stays static apart from its splash. No parallax or scroll-jacking.

The corporate site explains the product and its operator. Keep development language truthful: no launched-feature, safety, verification, founding-benefit or launch-date claims without evidence. Keep “Your kind of connection” as the brand line, with the concrete Adelaide/adult/development explanation immediately below it.

Primary newsletter action: **Get early updates**. A dedicated beta-interest page lets adults explain what they want to test without subscribing to marketing. Contact uses a separate form for enquiries, venues, press, feedback, support and privacy requests. City is selected from the shared JSON allowlist. Referral codes use a dedicated `/referral/` page, reached through “Found a code?” on the homepage. It collects email, code, adult declaration and launch-update permission, without a beta checkbox or access/reward promises.

Dedicated pages explain the product approach, safety, verification and venue concept using the product documents. Development context is stated where it clarifies actual availability; repeated “not ready” language is removed. No claim of live verification, moderation, venue inventory, launch dates or guaranteed safety is added. See [corporate site guide](corporate-site-guide.md).

The shared footer uses owner-supplied X and Instagram accounts. Unknown accounts retain icons and accessible non-navigating placeholders in `site.config.json`, as explicitly requested. News uses validated Markdown, with all five prepared articles in draft mode and excluded from production output and sitemap. Publish through a reviewed content change, with an accurate publication date.
