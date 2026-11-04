# @universe/transactions-ui

Presentational transaction views shared by every product. Each view gets its data through props, reports actions through callbacks, and imports nothing from business logic or analytics code.

- `src/common/`: views rendered by two or more products.
- `src/swap/`: swap-only views. Other products get their own folder when they start.
- `src/index.ts`: the only public entry, generated with `bun transactions-ui generate:index`.

Apps and `packages/uniswap` import from `@universe/transactions-ui`. Adapters in `packages/uniswap` read stores, resolve flags, own modal shells and log analytics, then spread props onto these views. The `transactions-ui-*` lint fences in `config/oxlint-plugins/import-boundaries.json` keep the package free of all of that and keep product folders apart.

**Allowed dependencies:** `@universe/mycelium`, `@universe/chains`, `@universe/api` (types only), `@uniswap/sdk-core`, `utilities` (not its telemetry), `react-i18next`. Declared as views start using them (knip rejects unused declarations).

Rules for views: `CLAUDE.md`. Policies: `scripts/transactions-ui/POLICIES.md`. Movability ledger: `bun scripts/transactions-ui/ledger.ts`.
