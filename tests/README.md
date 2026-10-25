# Calculator regression checks

Run from the repository with Node.js 18 or newer:

    node tests/calculator-regressions.cjs
    node tests/comparison-unit.cjs

These dependency-free checks execute the pages' actual inline JavaScript. They cover 34 focused numerical and validation cases plus the comparison harness scenarios, including unavailable data, malformed CSVs, stale output, switching ETFs, normalization and export.

The DOM and canvas are mocked. Passing these checks does not verify browser layout, accessibility, rendering, uploads or real market-data availability. Comparison data in the harness is synthetic and must never be published as historical ETF data.

## Benchmark publisher (offline)

    python3 tests/benchmark_publisher.py

This dependency-free suite injects synthetic CSV responses and a fixed UTC clock,
blocks network calls, and writes only to temporary directories. It is also part of
`npm run test:static`. It covers successful, partial and failed refreshes, legacy
and malformed caches, future/invalid dates, nonfinite/nonpositive prices,
duplicate/unordered observations, insufficient coverage and atomic-write failure.
Do not run `scripts/update_benchmarks.py` to run tests: its CLI contacts the provider.

Published data uses the UI's `metadata[symbol]` contract: `fetched_at` is the
successful UTC retrieval timestamp, not the last price observation; `status` is
`fresh` for a successful retrieval or `cached` after a failed attempt. A newly
retrieved history may still end at an older price date; the UI labels both dates
separately. Cached data keeps its valid per-series timestamp. Legacy global
`updated` is not trustworthy retrieval evidence, so missing/invalid per-series
times are `null` and display as unknown. The aggregate `updated` is the oldest
known series retrieval date, or `null` when any published series has unknown
retrieval time. Neither cache reuse nor file generation advances retrieval times.

Source and cached series must both contain at least 200 strictly increasing,
unique, nonfuture calendar dates with finite positive prices. At least three valid
series are required to replace the file; failed publication leaves existing bytes
unchanged. These tests do not establish provider availability or publish a dataset.

## Optional local benchmark CSV

The comparison page can use either a published built-in ETF dataset or a separate
user-provided `date,value` CSV. Source selection is explicit: a missing built-in
file remains unavailable, and uploading does not publish or replace that dataset.
Both files use the same parser and 3 MB per-file limit. A custom source is labeled
user-provided and not independently verified in the status, results and export
header. There is no provider-freshness or adjusted-total-return claim for it.

`node tests/comparison-unit.cjs` also covers independent first/last-intersection
arithmetic, unmatched dates, safe export attribution, malformed/nonpositive values,
file limits, canceled/repeated/interrupted reads, replacement/reset/source-switch
races, delayed built-in success/failure, stale metric/canvas clearing and explicit
switch-back behavior. A completed custom file remains in memory when switching
sources; Clear benchmark file removes it, and reload clears both files. Files are
not stored in URLs or browser storage. The existing canonical-only share action is
unchanged. Deposits/withdrawals are not adjusted; this remains a price/value
comparison, not a verified total-return or cash-flow-aware performance model.

`tests/browser/comparison-upload.spec.cjs` exercises those flows using real file
inputs and intercepted synthetic successful/missing datasets in both configured
viewports. It also checks actual chart pixels/download bytes, local-only requests,
no browser storage, text-only filenames and canonical-only sharing. Test discovery
is not browser execution: these browser cases require an actual CI run. Neither
suite contacts a provider, publishes data or establishes live market availability.
