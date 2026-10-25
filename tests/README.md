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
