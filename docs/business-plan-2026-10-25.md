# Compound Your Future — business plan
**Prepared October 25, 2026 | Target horizon: March 31, 2027**  
Domain: compoundyourfuture.com  
Repository: chaosbegone365-create/compoundingtools  
Owner target: $2,000/month gross revenue (stretch goal, not guaranteed). Infrastructure target: $0/month software/hosting within free tiers; domain renewal, taxes, payment processing, and optional professional review are separate.

## 1. Executive decision
Build a trustworthy decision platform, not a commodity collection of keyword pages. The product journey is **question → editable calculator → plain-English result → alternative scenarios → transparent assumptions → optional next step**. Start with compounding, retirement, career, and trip planning because those support repeat use and clear next actions. Monetize through a mix of relevant affiliate offers, ethical founding sponsorship pilots, contextual ads after publisher approval, and optional digital templates.

The first commercial goal is **one real dollar of verified revenue**, then $100/month, then $500/month, rather than claiming success based on traffic or applications. A new domain may not attain meaningful organic traffic by March 2027; the $2,000 target is a stretch.

## 2. Snapshot and immediate blockers (verified in GitHub on Oct. 25)
The repository has working initial calculator experiences, six category hubs (money, career, family, travel, health, home), initial legal/about pages, and GitHub issue plans #1–#3. The homepage currently uses the Compound Your Future title, and the category hubs link to subordinate pages. However:
- The checked **sitemap.xml contains only a GitHub Pages URL**, not the new canonical domain or all intended content pages.
- The checked **robots.txt advertises that GitHub Pages sitemap**.
- The options, performance comparison, privacy and terms pages contain 'noindex' tags; review deliberate versus inadvertent choices, especially the two valuable calculator pages.
- Many category hubs are short and need useful descriptions, examples, and tested calculators, not simply navigation tiles.
- Live production domain resolution/HTTP status, Cloudflare Pages deployment, and actual Search Console traffic could **not** be independently verified with available external access. A committed workflow is not proof of a running site.
- Initial affiliate tracking: the owner previously said the Expedia Group application was submitted; this does **not** establish acceptance or commissionability. No approval or completed Booking.com, Coinbase, or TurboTax enrollment is verified here.

### Hosting change
Use **GitHub as source and issue tracking**, but **Cloudflare Pages** as the commercial production host, rather than depending on GitHub Pages. GitHub's stated Pages restrictions say that it is not to be used as a free web-hosting service to run an online business. Cloudflare Pages supports automatic deployments from GitHub, custom domains, preview environments, and a free build limit of 500 per month. Configure GitHub -> Cloudflare Pages production branch 'main'; configure custom apex and www redirect after verifying DNS; disable duplicate production indexing and canonicalize to https://compoundyourfuture.com/.

## 3. Target segments and value proposition
| Segment | Problem | Lead calculator | Possible monetization |
| --- | --- | --- | --- |
| New savers (20–40) | Will contributions make a difference? | Compound interest, savings goal, fee drag | Neutral financial education and vetted partners |
| Families (25–50) | Can we afford childcare or one income? | Childcare vs one-income, college, household stress test | Family budgeting partners, optional templates |
| Career professionals | Is this offer/bonus/raise good? | Total compensation, bonus, offer comparison, salary percentile | Tax-filing and approved career partners |
| Pre-retirees | When can I retire or coast? | Coast FIRE, retirement runway, drawdown scenarios | Planning software and education |
| Travel planners | What vacation fits my money and preferences? | Destination ideas and itineraries + realistic budget | Approved travel booking affiliate links |
| Home shoppers | What is the true ownership cost? | All-in mortgage, rent-vs-buy, down-payment | Vetted mortgage education partners; licensing review |

**Differentiation:** no signup for basic calculators; editable assumptions; side-by-side conservative/base/optimistic cases; clear real versus nominal values; downloadable or shareable summaries; understandable methodology; useful related-tool navigation; independent results regardless of affiliate payouts. The six categories should form a coherent 'life decisions' journey, with money and investing as the brand's center of gravity.

## 4. Competitive landscape
| Competitor | Verified strength | Implication |
| --- | --- | --- |
| NerdWallet | Broad calculators with writer/editor review and frequently updated methodology | Do not compete on volume; build deeper scenarios and transparent formulas |
| SmartAsset | Retirement tool integrating account types, taxes, other income and withdrawal assumptions | Lead with focused calculators before promising full retirement planning |
| Investor.gov (SEC) | Credible free compound-interest, savings-goal and fund-cost tools | Cite foundational resources and improve UX without suggesting official endorsement |
| Calculator.net and narrow finance tools | Broad keyword coverage or sophisticated single-purpose visuals | Target narrow intent with genuinely distinctive explanations and comparisons |

**Moat hypothesis, not established fact:** combine a premium fast site, cross-category decisions, and practical next steps without intrusive accounts or misleading recommendations. Brand alone does not overcome incumbents' authority.

## 5. Product roadmap
### Tier A — by end-November
- Money & investing: compound interest with monthly contributions; investment growth; inflation-adjusted future value; expenses/fee drag; dividend reinvestment estimator.
- Retirement: retirement savings, early retirement/coast FIRE, withdrawal runway including negative-return sequences *when tested*, savings-gap calculation.
- Career: bonus payout, compensation offer comparison, raise vs inflation, salary benchmarking using licensed/allowed BLS May 2025 OEWS reference data with clear geographic/occupation caveats.

### Tier B — December to January
- Family: childcare vs staying home (tax/benefits caveats), college savings (529 as generic scenario, not product recommendation), one-income family budget.
- Travel: **Vacation Planner & Trip Ideas** must ask about origin, timeframe, budget, people, interests and pace; recommend 3–6 curated plausible destinations; show example day-by-day itineraries; provide transparent estimated airfare/ground transport/lodging/food/activities/taxes/contingency buckets. Curated illustrative data must be dated. **Never present estimates as current flight/hotel quotes or imply live inventory.** Offer separate actions for stays, flights, attractions and rental cars only with genuine official/approved links.
- Home: all-in mortgage payment with property tax, insurance, PMI/HOA; rent-vs-buy with transaction costs, taxes, appreciation scenarios.
- Health: fitness time-to-goal and non-medical activity budget tools; no diagnosis, treatment claims, or nutritional prescriptions.

### Tier C — February onward, based on demand
- Advanced deferred-compensation election planner, mortgage payoff scenarios, parent leave cost planner, portfolio stress testing, shareable financial plans, embeddable widgets.
- Add a digital download/printable bundle only after validating willingness to pay.

**Definition of done for every calculator:** unique purpose; three validated examples including edges; informative input validation; transparent formula/source notes; stable mobile and keyboard UX; results with assumptions and limitations; meaningful internal links; accessible summary/table; relevant optional partner CTA; no collection of private finance data by default.

## 6. Technical architecture and quality gates
- Keep existing lightweight HTML/CSS/JS for MVP. Avoid a full rewrite unless maintainability demands it. Static generation can later create clean URLs and shared layouts.
- Production: Cloudflare Pages with GitHub integration. Tests on PR; preview build; approved main merge triggers production. Maintain one canonical domain and redirect all variants.
- Github repository contains tests, content, structured data and non-secret affiliate registry; configuration/account credentials must stay in secure provider dashboards/secrets, never browser JS or public Git history.
- Suggested checks: HTML validity, relative links, no accidental 'noindex', sitemap generated from indexable pages, unique title/H1/meta/canonical, responsive screenshots, keyboard/ARIA checks, automated finance formula unit tests, smoke tests for every calculator, zero false live-price claims, Lighthouse/page-speed budget.
- Cloudflare free privacy-first Web Analytics; free Search Console (verification required). Keep events aggregated: pageview, calculator_complete, scenario_compare, share, optional_partner_click, template_purchase; do not collect dollar inputs or names.
- Weekly GitHub Actions cron can check links and formulas; publishing requires review gates. No unrestricted autonomous AI mass publishing.

### Immediate specific fixes
1. Verify the site loads over HTTPS at compoundyourfuture.com and choose canonical www/non-www (recommend non-www).
2. Replace GitHub Pages URLs in sitemap.xml and robots.txt after verifying domain.
3. Generate sitemap entries for every intended canonical indexable tool and hub; exclude intentionally noindexed pages.
4. Reassess 'noindex' on options and performance pages; retain only for legitimate reasons.
5. Add a dedicated affiliate disclosure policy; make visible disclosures near link placements.
6. Normalize brand copy/logo throughout repo and fix category/deep-link navigation.

## 7. SEO and organic distribution
### Technical prerequisites
Google Search Console verification, indexability, 200 status, canonical URLs, crawlable internal links, XML sitemap, robots.txt, working mobile site, no duplicate/empty content. Search Console traffic numbers are unknown until configured and measured.

### Topical clusters and landing pages
**Cluster 1: Compounding:** 'compound interest calculator with monthly deposits'; 'how much will $500 a month grow'; 'investment calculator after inflation'; 'investment fees impact calculator'. Link all to compound-interest hub, savings goals, and retirement.

**Cluster 2: Retirement:** 'coast FIRE calculator by age'; 'retirement income needed for $X spending'; 'retire at 50 calculator'; 'how long will savings last in retirement'. Avoid implied certainty in withdrawal rates.

**Cluster 3: Compensation:** 'bonus payout percentage calculator'; 'salary vs stock offer calculator'; 'raise after inflation calculator'; 'childcare vs salary calculator'. Employment and tax claims should cite government datasets.

**Cluster 4: Travel:** 'vacation budget for family of four'; 'where can I go for $3,000 vacation'; 'weeklong vacation budget estimate'; 'drive vs fly vacation cost'. Curated destination pages must add substantive original value, not city-name permutations.

**Cluster 5: Home/family:** 'all in mortgage payment calculator'; 'rent vs buy break even'; 'monthly college savings goal'; 'second income after childcare costs'.

### Production policy
Publish 2–3 **reviewed, original** tool-linked explanations per week where quality permits. Each page: clear search intent, unique title/H1, upfront useful calculator, editable defaults, worked example, interpretation and limits, citation and last substantial update date, 3–5 truly relevant internal links, optional sponsor disclosure. FAQ content is useful for readers, not a guaranteed FAQ rich-result tactic; validate any structured data against eligibility. Avoid doorway pages, near-duplicate AI articles, purchased links, and misleading 'expert' bylines. Use real personal experience only where demonstrable.

### Free distribution
- SEO and helpful non-promotional answers in relevant communities, with links only if community rules permit and link adds value.
- Publish genuinely useful visual scenario comparisons on social channels (not automated repetitive spam).
- Offer embeddable calculators or methods to complementary bloggers/newsletters with attribution and permission.
- Partner with HR/personal-finance bloggers for co-branded examples; do not buy links.
- Consider Pinterest for curated, practical vacation and family-budget concepts.
- Build opt-in educational email only when unsubscribe/privacy setup exists; no scraped mailing lists.

## 8. Monetization waterfall
**A. Affiliate referrals (early test).** Priority: Expedia Group/Vrbo (owner submitted, approval unverified), Booking.com (free publisher program, not verified applied), TurboTax via CJ (tax relevance), Coinbase (only appropriate crypto educational context, regulated risk). Airbnb's general publisher program is not accepting applications as of this research; do not describe ordinary Airbnb links as paid. Affiliate placements live *only* after confirmed acceptance and link issuance. Disclose any material relationship clearly and nearby.

**B. Founding sponsor pilots (early but difficult without audience).** Prospect 30–50 narrowly relevant brands over 8 weeks. Offer a 60-day test at an *asking* price of $100–$250 per month per brand, flexible based on exposure and fit. Package: one clearly labeled relevant placement, a sponsor profile or editorially controlled resource if useful, monthly reporting, cancellation after term. Never promise minimum impressions or call a sponsorship an investment in guaranteed reach. An introductory free placement for a notable partner may be worth more than a discounted paid placement while traffic is near zero. Outreach only to verified business contacts and with CAN-SPAM compliance, including truthful identity, mailing address, and opt-out handling.

**C. Contextual advertising (after content/traffic).** Apply for AdSense only once the site has substantive original content, compliant policies, and user-friendly layout; acceptance is not guaranteed. Use ad RPM as an observed actual metric after activation, not an assumed entitlement. Avoid ads next to inputs/results that make the calculator hard to use.

**D. Optional digital products.** $9–$29 budget/checklist or spreadsheet packs: retirement scenario workbook, vacation budget itinerary template, compensation comparison workbook. Basic calculator stays free. Payhip has $0/month plan with platform fee of 5% per transaction plus separate processor fees; alternatively Stripe Payment Links pay-as-you-go without paying for a custom payment-link domain. Payment account approval and legal/tax handling require owner.

**E. Later:** white-label widgets, newsletters, B2B licensing only once there is demand.

## 9. Unit economics and transparent scenarios
Define ad revenue = pageviews/1000 × realized page RPM. Affiliate revenue = visits × outbound click rate × eligible completed-action conversion × average *net recognized* commission. Digital products = paid orders × net price; sponsorship = contracted monthly amounts earned. Views do not imply sessions or conversions.

**Ads alone to reach $2,000/month:**
- At $5 page RPM: 400,000 monthly pageviews.
- At $10 page RPM: 200,000 pageviews.
- At $20 page RPM: 100,000 pageviews.
These are pure algebra under illustrative RPM assumptions, **not observed market rates or predictions**.

| March case | Monthly pageviews | Ads | Qualified affiliate completions | Affiliate revenue | Sponsors | Paid templates | Monthly gross |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Low traction | 3,000 @ $5 RPM | $15 | 1 × $25 | $25 | $0 | $0 | **$40** |
| Working base | 20,000 @ $10 RPM | $200 | 10 × $25 | $250 | 1 × $150 = $150 | 5 × $19 = $95 | **$695** |
| Stretch | 50,000 @ $12 RPM | $600 | 25 × $25 | $625 | 3 × $200 = $600 | 10 × $19 = $190 | **$2,015** |

For the stretch affiliate funnel, 50,000 pageviews might correspond to 40,000 sessions at 1.25 pages/session; if 4% click an eligible partner link, that is 1,600 outbound clicks; at 1.56% qualified completion, about 25 completions. These assumptions could easily miss by multiples and require approved offers and settlement. Gross excludes payment fees, refunds, reversals, taxes and owner time.

**De-risking milestones:** first $1 earned, $100/month earned, 1 approved affiliate and first real conversion, 1 sponsor pilot, $500/month sustained. Revise forecast monthly. Never count applications, affiliate clicks, or unsigned sponsor discussions as recognized revenue.

## 10. KPIs and decision thresholds
**Weekly scorecard:** deploy health and broken paths; intended indexable pages; Search Console impressions/clicks/CTR/median ranking by cluster; unique sessions and pages/session; calculator starts/completions; relevant CTA click-through; verified approved referrals / completions / earnings / reversals; sponsor contacts/replies/meetings/contracts; paid orders and refunds; uptime and accessibility regressions.

**Early target gates, not predicted outcomes:**
- End-November: live working canonical site, Search Console set up, 8–12 substantively helpful and tested cornerstone URLs. Sponsor pilot deck ready.
- End-December: 18–25 quality URLs, travel planner v1 and six usable hubs, at least 1 concrete partner application reviewed.
- End-January: 30–40 useful URLs where quality gates permit, 20 personalized sponsor pitches, at least 1 measured user journey.
- End-February: 40–50 high-quality URLs *if useful*, tested conversion tracking, 1–2 specific monetization experiments with verified results.
- End-March: revenue reality check; budget/time decision based on actual data, not inflated traffic projections.

**Kill / pivot rules:** If core pages cannot be indexed, stop mass content and fix technical problems. If organic impressions remain close to zero after crawl/index verification, focus on authority and referral distribution. If a sponsor placement has no demonstrable value, stop selling it. If 10+ adequate partner outreach attempts produce no replies, revise targeting and proposition rather than spamming more.

## 11. Compliance, data integrity, and operating risk
- Money/investment/tax content is consequential: clearly label examples, date assumptions, demonstrate math, cite IRS/SEC/Federal Reserve/BLS or other reliable sources; don't represent as individualized licensed advice.
- Benchmark salaries using BLS 2025 OEWS data dated to its May 2026 release; benchmark wealth using the Federal Reserve's newer **2025 Survey of Consumer Finances (released October 2026)**; note differing cohorts, definitions and sample coverage.
- Travel is **curated estimates** until authorized live quote APIs are available; no invented availability, prices, rooms, flights, destinations or false AI promises.
- Sponsored content should not bias calculator formulas, hide tradeoffs, or blur recommendation/objective information. Follow FTC affiliate disclosure guidance; sponsored placements clearly labeled.
- CAN-SPAM applies to commercial business outreach: accurate headers/subjects, physical address, unsubscribe route, prompt suppression. Avoid bulk blasting.
- Keep private keys, usernames, payment details, financial inputs and user emails out of public GitHub and URLs. Review privacy/consent for ads or analytics and payment partner requirements.
- Minimize cost but account for domain renewal, merchant fees, legal/tax review and content expertise. 'Zero recurring software fees' does not mean zero total business costs.
- External dependencies are real risks: Google algorithm decisions, publisher program changes, affiliate reversals, sponsorship churn and unsupported autopublishing.

## 12. Weekly milestones through March 2027
| Week | Dates | Deliverable | Verification |
| ---: | --- | --- | --- |
| 1 | 2026-10-26–2026-11-01 | Confirm serving domain and Cloudflare Pages Git integration; repository audit, indexability and QA | Production 200/HTTPS, manual core flow smoke tests |
| 2 | 2026-11-02–2026-11-08 | Correct canonical URLs, sitemap, robots, noindex choices; enable Search Console and analytics | All intended indexable URLs in sitemap; baseline dashboard |
| 3 | 2026-11-09–2026-11-15 | Polish investment-growth, compound-interest, retirement and bonus calculators | 4 cornerstone pages pass math/a11y tests |
| 4 | 2026-11-16–2026-11-22 | Publish Coast FIRE, fee drag, early retirement scenarios; 3 original examples | At least 3 new tested tools |
| 5 | 2026-11-23–2026-11-29 | Finish salary raise/offer and one-income family tools; source wage and assumptions | 2 new relevant tools and source notes |
| 6 | 2026-11-30–2026-12-06 | Ship vacation discovery MVP with 3+ curated ideas, real itineraries, qualified estimated costs | Trip ideas / budget QA; no invented live quotes |
| 7 | 2026-12-07–2026-12-13 | Publish six-category navigation audit and internal related-tool links | No dead category links; mobile navigation tested |
| 8 | 2026-12-14–2026-12-20 | Publish 4 original educational tutorials; first sponsor media kit and pipeline | 4 reviewed posts, 20 vetted prospects |
| 9 | 2026-12-21–2026-12-27 | Affiliate inventory and disclosure component; verify Expedia status and Booking/TurboTax/Coinbase | No unapproved tracking links; status ledger |
| 10 | 2026-12-28–2027-01-03 | Check Search Console indexing and resolve low-value and duplicate pages | Indexability blocker list reduced |
| 11 | 2027-01-04–2027-01-10 | Launch mortgage all-in and rent vs buy v1 with variable taxes/insurance | Home math regression tests |
| 12 | 2027-01-11–2027-01-17 | Launch savings goals and 529 estimate with education-only disclaimers | 2 distinct tools and related articles |
| 13 | 2027-01-18–2027-01-24 | Send first tightly targeted sponsor pilot pitches after compliance review | At least 10 individualized outreaches logged |
| 14 | 2027-01-25–2027-01-31 | Produce 4 additional deep examples and test title/meta changes on pages with impressions | Search impressions/CTR reviewed |
| 15 | 2027-02-01–2027-02-07 | Launch digital template MVP if customers request export/detail | 1 paid template; payments and delivery tested |
| 16 | 2027-02-08–2027-02-14 | Sponsor and affiliate follow-ups; improve click-through on useful CTAs | Partner reply, approved links and tracked clicks |
| 17 | 2027-02-15–2027-02-21 | Review traffic source economics; sharpen top-performing calculator cluster | Engaged sessions and revenue by page |
| 18 | 2027-02-22–2027-02-28 | Improve technical performance and accessibility; refresh outdated assumptions | Performance budgets and error tests pass |
| 19 | 2027-03-01–2027-03-07 | Expand into one proven growth cluster rather than all topics | 2-4 differentiated pages tied to demand |
| 20 | 2027-03-08–2027-03-14 | Partner expansion only if conversion evidence supports it | Measured sponsor and affiliate outcomes |
| 21 | 2027-03-15–2027-03-21 | Refresh site-wide SEO from Search Console query/page reports | Top landing pages each have a next action |
| 22 | 2027-03-22–2027-03-28 | Reforecast revenue, reject low-ROI work, and produce April plan | Actual net/gross revenue and pipeline |
| 23 | 2027-03-29–2027-03-31 | March checkpoint against $2,000 gross monthly stretch target | Cash received vs accrued, pageviews and outlook |

## 13. Few owner actions (not automated)
1. Approve GitHub-to-Cloudflare Pages connection and DNS/domain settings; verify site loads on canonical domain.
2. Verify Search Console ownership and enable Cloudflare Analytics; keep owner account credentials private.
3. Complete provider-specific affiliate and AdSense applications; agree to terms, supply truthful tax/payout details; confirm Expedia approval separately.
4. Authorize sponsor outreach and sender configuration. Configure hello@compoundyourfuture.com outbound identity with proper SPF/DKIM/DMARC where supported, not just Yahoo forwarding.
5. Approve sponsorship contracts and payment processor onboarding, and review consequential financial/medical content or commission-based referrals before publishing.

## 14. Reference links (checked Oct. 25, 2026)
- Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- Cloudflare Pages free plan limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/about/
- GitHub Pages commercial use restriction: https://github.com/github/docs/blob/main/content/pages/getting-started-with-github-pages/github-pages-limits.md
- Google people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Search Console: https://search.google.com/search-console/about
- AdSense signup/site requirements: https://adsense.google.com/start/how-adsense-works/
- FTC affiliate disclosures: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- FTC CAN-SPAM: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- Expedia partner program: https://creator.expediagroup.com/affiliates
- Booking.com affiliates: https://www.booking.com/affiliate-program/v2/index.html
- TurboTax affiliates: https://turbotax.intuit.com/corp/affiliates.jsp
- Coinbase affiliates: https://help.coinbase.com/coinbase/other-topics/cb-affiliate-program
- Airbnb affiliates restrictions: https://www.airbnb.com/help/article/4236
- Payhip pricing: https://payhip.com/features/sell-online
- Federal Reserve 2025 SCF: https://www.federalreserve.gov/econres/scfindex.htm
- BLS wage data: https://www.bls.gov/oes/tables.htm
- NerdWallet banking calculators: https://www.nerdwallet.com/banking/calculators
- SmartAsset retirement calculator: https://www.smartasset.com/retirement/retirement-calculator
- Investor.gov tools: https://www.investor.gov/free-financial-planning-tools
