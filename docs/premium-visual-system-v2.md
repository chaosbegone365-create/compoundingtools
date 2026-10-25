# Compound Your Future — Premium Visual System v2

Research date: 2026-10-25. Inspiration: Mercury (editorial restraint), Wealthfront (approachable financial visualization), Linear (precision and motion), Stripe (product-led storytelling). Adapt principles; do not copy proprietary assets or layouts.

## Art direction
A premium, warm, modern consumer-finance experience. Editorial confidence without bank-like coldness. Make calculators the visual heroes. Avoid stock photos, clipart, oversized emoji, noisy gradients, fake testimonials, and fabricated trust claims.

## Tokens
- Background: #F7F8F5 (warm ivory)
- Foreground: #142B2A (deep evergreen ink)
- Secondary text: #637572
- Primary action: #087F65 (emerald)
- Dark feature band: #102B2B
- Highlight: #D8F6E8 (pale mint)
- Surface: #FFFFFF
- Border: #E2EAE5
- Heading: Manrope or equivalent open-license geometric sans; body: DM Sans/system sans
- Content width: 1160px; generous whitespace; cards 16px radius; subtle 1px borders, restrained shadows
- Motion: 150–250ms ease-out, reduced-motion support; no scroll-jacking

## Homepage composition
1. Slim nav: wordmark, Calculators, Guides, About; prominent 'Explore tools' action.
2. Hero: eyebrow 'FREE TOOLS FOR BETTER MONEY DECISIONS'; headline 'See what your money could become.' with accent on 'become'; one-sentence value prop and 'Try a calculator' primary CTA.
3. Beside hero: a real, working miniature compound-interest preview with editable contribution, time horizon, and a chart; no decorative fake dashboard.
4. Trust strip: 'Free to use', 'No account needed', 'Transparent assumptions' only if true.
5. Popular calculators: 3 featured cards with readable outcome-based descriptions and consistent icons.
6. Browse by goal: Investing, Retirement, Career, Family, Home; ensure links resolve.
7. How it works: input → explore scenarios → understand tradeoffs.
8. Editorial explainers and methodology links; prominent educational-not-advice disclosure.
9. Minimal footer with contact, privacy, methodology, and disclosure links.

## Calculator page
Two-column desktop: controls left, result + live chart right. Mobile stacked. Show assumptions and units, include reset/share link, readable table alternative, and source/methodology note. Never display results that haven't been calculated. Label estimates, nominal/real dollars, tax treatment, and limitations.

## SEO and quality gates
Keep existing URLs functional. Remove noindex only when HTTPS site is live, calculator QA and disclosures are complete, and launch approved. Use semantic HTML, accessible labels, keyboard focus, contrast, mobile testing, performance budget, no heavy framework dependency. Validate actual live behavior before declaring completion.

## Implementation phases
A. Consolidate repeated CSS and create consistent tokens.
B. Redesign homepage with real interactive hero calculator.
C. Apply shared shell to calculator pages.
D. QA on mobile/desktop, verify deployment, remove beta noindex at launch.
