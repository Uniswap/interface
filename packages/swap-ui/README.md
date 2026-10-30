# @universe/swap-ui

Presentational swap views. Every component in this package receives all data via props, emits actions via callbacks, and imports nothing from business logic or analytics code.

**Allowed dependencies:** `@universe/mycelium`, `@universe/chains`, `@universe/api` (types only), `@uniswap/sdk-core`, `utilities` (not its telemetry), `react-i18next`. Declared as the first tenants actually use them (knip rejects unused declarations). Never `uniswap/src`, never `ui/src`. There is no shared types package: views share one vocabulary file, `src/types.ts`.

**Admission:** a view moves here once it takes all data through props and emits actions through callbacks. The `swap-ui-package` lint fence (`config/oxlint-plugins/import-boundaries.json`) enforces the import side on everything under `src/`. Adapters that read stores, resolve flags, fetch data, own modal shells, or log analytics stay in `packages/uniswap` and spread props onto these views.

The movability ledger (`bun scripts/swap-ui/ledger.ts`) tracks which swap views can still move and what blocks the rest.

Policies: `scripts/swap-ui/POLICIES.md`. Per-batch contract: `scripts/swap-ui/EXTRACTION-GUIDE.md`.
