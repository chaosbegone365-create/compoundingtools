# Calculator regression checks

Run from the repository with Node.js 18 or newer:

    node tests/calculator-regressions.cjs
    node tests/comparison-unit.cjs

These dependency-free checks execute the pages' actual inline JavaScript. They cover 34 focused numerical and validation cases plus the comparison harness scenarios, including unavailable data, malformed CSVs, stale output, switching ETFs, normalization and export.

The DOM and canvas are mocked. Passing these checks does not verify browser layout, accessibility, rendering, uploads or real market-data availability. Comparison data in the harness is synthetic and must never be published as historical ETF data.
