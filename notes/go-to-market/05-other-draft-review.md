# Review and incorporation of the unfinished ChatGPT draft

Reviewed 18 October 2026 against the [same original brief](../pre-launch-marketing-growth-and-go-to-market-strategy-brief.md) and the existing strategy pack. The repaired consolidated reading edition is [other.md](../other.md).

## What the draft was trying to resolve

The draft's explicit central problem is the **local cold start**: an unfamiliar dating service must attract people whose locations, intentions and reciprocal preferences overlap, and coordinate their participation before an empty experience drives them away. It tries to turn early brand awareness into a qualified city waitlist, beta access, genuine activation and repeatable expansion.

Four tensions organise its proposed solution:

1. **Desirable access versus inclusion.** Invitations should control real capacity and useful participation, without becoming a social-status test or misleading scarcity.
2. **Founder loyalty versus financial liability.** A permanent badge should survive subscription cancellation; permanent paid features can create an open-ended obligation.
3. **Registration growth versus network usefulness.** The important result is relevant active people, conversations and retention, not a large scattered list.
4. **Early promotion versus truthful product promises.** The brand can explain a vision now, but verification, support and privacy controls need implementation evidence before availability claims.

A fifth issue appears in one paragraph: **whether founder recognition could be restored after account deletion without restoring sensitive profile data**. It refers to a “previously proposed” recovery-token model, but no such approved model was found in the supplied brief or strategy documents. This is an unresolved design suggestion, not evidence that the user approved recovery or that it exists.

## Where it stopped and what was missing

The supplied file contains approximately 3,867 words across 399 lines. It covers A–F, including a 30-day calendar, then ends during a launch-announcement draft with the incomplete text `18`. There are no sections G–L. The cutoff is consistent with truncation, but the file does not establish whether an output limit, copying problem or another interruption caused it.

It contains flattened tab-separated tables, orphaned website labels such as “OAIC +1” and “BetaList +3,” copied UI text such as “All 30 daysPostsOperations,” no recoverable citation URLs, and an unfinished age statement. The source labels alone cannot reconstruct exactly which pages ChatGPT consulted. New verified links are replacements, not recovered original citations.

Preserved source: [other-chatgpt-original.md](../source-material/other-chatgpt-original.md), byte-for-byte SHA-256 `6187bb2a87d8e56aa0cfd3bbbf3f5cff661ca980adbd52b0f96801373470fb1e`. This archival copy deliberately retains its errors and truncation; use the revised documents for recommendations.

## Reconciliation decisions

| Material in original draft | Assessment | Incorporated outcome / destination |
| --- | --- | --- |
| Adelaide-first city waitlist and controlled onboarding | Consistent with the brief and existing recommendation | Retained throughout [strategy A, D, G, J](01-strategy.md) and repaired `other.md` |
| “Connect on your terms” | Useful positioning alternative, but broad and unproven | Added as a message test against the existing brand headline; no silent brand replacement or claim of delivered controls |
| Adelaide as overlapping matching markets | Strong explanation of fragmentation | Explicitly retained in consolidated assessment and compatibility dashboard |
| Invitations manage capacity rather than status | Useful and consistent | Retained, with separate public sharing and private access instruments |
| Initial allocation of 500 founders | Hypothesis without demonstrated capacity/demand basis | Not adopted as the default. Use a published beta eligibility window and real operating capacity; a future cap needs justification and auditable terms |
| Founder eligibility requires activation but no contribution | Material difference from existing pack | Retain the pack's proposed activation plus one accessible feedback/testing contribution. This is still a DEFAULT for review, not an approved company requirement |
| Founder priority before beta admission | Can become circular if status is earned after activation | Do not promise unearned founder status as the condition for first access. Invite based on transparent test eligibility and capacity |
| Referral ladder at 1/3/5/10 activated referrals, including priority access | More complexity and possible demographic/social-circle distortion | Retain the simpler pack model: optional private contribution recognition at 3 confirmed local referrals; any later finite trial requires qualified activation, cost/abuse review and a cap. No referral-based admission promise |
| Same 12-character code for referral/invitation use | Conflates attribution and access; 12 Base32 characters carry at most 60 random bits | Separate ≥96-bit public referral IDs and ≥128-bit private invite secrets; no identity verification implied. These are proposed engineering defaults |
| 30-day invitation validity | Plausible but can leave a supported wave uncertain for a month | Retain seven-day default plus fair extension/reissue; test 30 days only as an explicit campaign variant, with the same capacity controls |
| Founder restoration after deletion | Potentially useful, but unsupported “previously proposed” reference and unresolved privacy/transfer risks | New explicit OPEN design note and acceptance cases in [developer requirements](04-developer-requirements.md#founder-recognition-after-account-deletion). No automatic recovery entitlement promised |
| BetaList pre-launch listing | Appropriate subject to actual criteria/price | Existing checked recommendation retained; no assumed free submission |
| Launching Next | Useful new candidate; current official form verified | Added as P2 free submission option; its $99 expedited consideration is optional, currency/checkout terms unverified; no paid recommendation |
| AlternativeTo “once usable” / during private beta | Ineligible under published rules: private/invite-only and geographically restricted services excluded | Removed from actionable launch destinations; retained only in exclusions with the reason. [Official FAQ](https://alternativeto.net/faq/) |
| Indie Hackers Add Your Product | Public product page and entry route verified, authenticated eligibility/fees not completed | Added as P3 founder-ecosystem watchlist, not verified Adelaide consumer acquisition |
| Lot Fourteen | Relevant local ecosystem; not a confirmed listing/distribution partner | Added as P2 ecosystem research lead; avoid double-counting overlap with Stone & Chalk |
| Google/Bing indexing and structured data | Useful addition; indexing/appearance not guaranteed | Added Bing ownership/sitemap checks and conservative schema guidance to strategy and execution |
| Reddit “after access is restored” | Presupposes a restriction without evidence in the project files | Replaced with “after ownership/access/standing is verified.” No claim an account is banned or restored |
| Whole platform workload table | Individual rows can add up beyond one founder's time | Keep Instagram plus local recruitment and consented email; supporting channels reuse content. TikTok remains conditional, not an extra mandatory channel |
| Qualified waitlist target 300–600 in 90 days | Unsourced operating hypothesis; can consume budget without proving utility | Optional sensitivity exercise, not target or launch gate. Report confirmed interest, qualified candidates and activation separately |
| At least 90% attribution | “Attributed or unknown” is not 90% known attribution | Require 100% classification into documented source or explicit unknown; report actual known-source share without inventing missing attribution |
| Conflicting local-experiment timing in the existing pack | Local detail previously accelerated interviews/sessions/beta relative to the master plan | Aligned to the master weeks: five interviews by week 2, about 20 by week 4, first session week 6, readiness rehearsal week 7, conditional first beta week 8 |
| Fixed 19 October–16 January window | Valid illustrative 90-day window, not an approved launch schedule | Repaired edition uses relative weeks; calendar dates remain illustrative only |
| “Could not retrieve live site” | Honest limitation of that draft's browsing session | Preserve as historical provenance only. Existing pack's separate source/live-HTML audit is identified; no fresh visual/browser or inbox claim |
| Announcement points to the application host | Conflicts with the corporate website role | Use swoovr.com in marketing; maintain application hosting separately |
| Missing G–L | Required outputs absent, including budget/dashboard/developer/action work | Completed in repaired edition and linked to full detailed sections; original cutoff is identified |

## New sources checked during reconciliation

- [Launching Next official submission form](https://www.launchingnext.com/submit/): free submission and an optional $99 upgrade for consideration within one business day, not guaranteed publication. Pricing currency and final checkout terms were not verified.
- [Indie Hackers products page](https://www.indiehackers.com/products): visible Add Your Product route to account access; current authenticated submission acceptance/terms remain OPEN.
- [Lot Fourteen official site](https://lotfourteen.com.au/): local innovation ecosystem, not proof of a public Swoovr submission opportunity.
- [AlternativeTo official FAQ](https://alternativeto.net/faq/): confirms the eligibility exclusions above.
- [OAIC direct-marketing guidance](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/direct-marketing): clarifies sensitive-information consent where applicable. Applicability must be assessed for Swoovr; optional marketing consent is not permission to upload intimate preferences to ad platforms.
- [Bing ownership verification](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b) and [sitemap guidance](https://www2.bing.com/webmasters/help/sitemaps-3b5cf6ed): practical discovery work, not an indexing guarantee.
- [Google SoftwareApplication structured-data documentation](https://developers.google.com/search/docs/appearance/structured-data/software-app): use accurate supported information and eligibility checks, not fictional rating/download/offer facts.

## How to use the revised documents

Read [other.md](../other.md) for a single consolidated A–L answer. Read the [pack index](README.md) for the detailed calendars, research tables, financial sensitivity and acceptance cases. Use this review to understand which original ideas were retained, changed or left open. The preserved source is provenance only.

The recommended strategy remains Adelaide-first, evidence-led and bounded by real product/support capacity. Incorporating a second generated response does not turn its assumptions into validated company facts or imply permission to implement, advertise, contact organisations or spend.
