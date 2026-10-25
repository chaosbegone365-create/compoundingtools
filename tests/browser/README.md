# Browser acceptance checks

These tests run only against a loopback static test server, never the live site. They exercise eight scenarios in desktop Chromium and a 390×844 mobile viewport. Mobile emulation is not real-device testing or a complete accessibility audit.

## Run

From the repository root, with Node.js 22:

    npm ci --ignore-scripts --no-audit --no-fund
    npx --no-install playwright install --with-deps chromium
    npm run test:static
    npm run test:browser

The exact Playwright 1.64.1 dependency and transitive dependencies are locked with registry integrity hashes. Installation of trusted browser binaries is explicit; npm lifecycle scripts are disabled. The local server listens only on 127.0.0.1:4173, supports read-only methods, rejects dot paths/test/dependency directories and traversal, and never writes files.

External browser requests are blocked. Benchmark history is an explicitly synthetic fixture intercepted in a test; it is never written into production data. No shopper information, portfolio data, credentials or real transactions are used. The meal tests target accessible controls, not a specific recipe quantity, so measured-quantity changes remain testable.

## CI safety and costs

`.github/workflows/quality.yml` runs for pull requests targeting main and optional manual dispatch. It does not deploy, run on a schedule, use an environment, expose secrets, grant write permissions or keep checkout credentials. The job is limited to public repositories and standard ubuntu-latest. No artifact upload, HTML report, trace/video upload or dependency cache is configured, avoiding artifact/cache storage exposure. Logs contain synthetic-test results only.

Repository visibility was verified public on October 25, 2026. GitHub states standard hosted public-repository runners are free; larger runners are charged, and artifact storage has separate allowances. This workflow does not request larger runners or artifact storage.

## Evidence limits

Local validation: configuration/scripts parse, locked `npm ci` succeeds, and `playwright test --list` discovers 24 cases. Browser execution has NOT been performed in this restricted workspace. Only an actual successful CI run for the exact commit establishes these cases passed. It does not establish live production deployment, real ETF source availability, actual grocery prices, retailer-cart integration, search rankings or complete accessibility.

Sources inspected:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://www.npmjs.com/package/%40playwright/test?activeTab=versions
- https://playwright.dev/docs/ci-intro
- https://playwright.dev/docs/test-webserver

Concurrent-main reconciliation adds expanded all-in mortgage, fitness comparison, workout schedule and renovation initialization/invalid-state checks. Layout also checks controls stay within their field tracks. The 24 discovered cases still require an actual exact-commit CI run.
