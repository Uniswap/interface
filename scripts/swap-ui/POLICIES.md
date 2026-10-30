# swap-ui view policies

These are the rules for swap view components, written down before any refactoring starts. They define what "presentational" means for the swap tree and what the eventual `@universe/swap-ui` package will accept.

**Definition of done for a view:** all data arrives via props, all actions leave via callbacks, and the file imports nothing from business logic or analytics code. The ledger (`bun scripts/swap-ui/ledger.ts`) measures every view file against this bar and classifies what still blocks it.

## The views/ directory convention

A `views/` directory inside `packages/uniswap/src/features/transactions/swap/` means: every file in it is a presentational view. Nothing else goes in there. Helpers that only serve a view (pure formatting, layout constants) may live alongside it; anything that reads state, resolves flags, fetches, or logs may not.

The convention is fenced mechanically: the `swap-ui-views` entry in `config/oxlint-plugins/import-boundaries.json` makes it a lint error for a file under a swap `views/` directory to import stores, redux, analytics, feature flags, react-query, or modal shells. A file moves into `views/` only when it passes the fence.

The fence is the hard floor for the classes we ban outright. The remaining movability blockers (`ui-src`, `uniswap-runtime`, `types-pending`) drain by refactor and are tracked by the ledger, not the fence.

## What the ledger reports

The ledger sorts every `.tsx` under the swap tree (tests, stories and fixtures excluded) into one of three file classes:

| File class | Rule | Counted as |
| --- | --- | --- |
| View | the default: any file that is not a stub or an adapter | a view file; MOVABLE at zero blockers, otherwise blocked by class |
| Stub | throws `PlatformSplitStubError` (platform-split placeholder) | a view file, trivially clean, never movable |
| Adapter | imports `@universe/swap-ui` | its own count (`adapters`); not a view, not movable, not blocked, not batched |

An adapter is the `packages/uniswap` side of a finished split (see Policy 4). It reads stores, resolves flags and derives values on purpose, so those imports are not blockers and the ledger records none for it. The rule is import-based: `components/SwapRateRatio.tsx` became the first adapter the moment it rendered `RateRatio` from the package. Heuristic v1 counted such files as blocked views; v2 reports them separately.

## Policy 1: no analytics in views

Views never import `uniswap/src/features/telemetry` or `utilities/src/telemetry`. No `Trace`, no `sendAnalyticsEvent`, no `ElementName` constants.

**Why:** analytics is a business decision (what to log, under which event name) attached to a presentational moment. Baking it into the view couples the view to the telemetry runtime and its event taxonomy.

**How:** the view emits a semantic callback (`onPressReview`, `onExpandDetails`). The adapter decides what to log. When a subtree needs a `Trace` boundary, the wrapper lives in `packages/uniswap` and composes around the view, the way `SwapFormButtonTrace` already wraps `SwapFormButton`.

## Policy 2: modal shells stay in adapters

Views never import `uniswap/src/components/modals`. The native `Modal` deliberately stays gorhom-based inside `packages/uniswap`, so a view that imports a shell can never leave the package.

**How:** the view exports the modal content as a plain component. The adapter owns the shell: it wraps the content in `Modal` or `WarningModal`, wires `isOpen`/`onClose`, and handles platform differences. One shell import per modal, in exactly one adapter file.

## Policy 3: slot budget

When a view needs to render a shared component that cannot move yet (for example `TransactionDetails` or `CurrencyInputPanel`), the component is passed in as a `ReactNode` prop (a slot) instead of imported.

**Budget: at most 4 slots per view.** Slots exist to cross the package boundary, not as a general composition style. A view that wants a fifth slot is telling you the split boundary is wrong: either the slotted content is really part of this view, or the view should be split differently. Exceeding the budget requires an explicit justification in the PR that adds the slot.

**Why the cap:** every slot moves layout knowledge to the adapter and turns the view into a pass-through frame. Past the cap, the "view" no longer owns its own composition and the extraction stops paying for itself.

## Policy 4: view-model stores keep their role

View-model stores like `swapFormScreenStore` (a display-fed provider that derives everything the form screen renders) are an adapter-layer mechanism, and they stay that way.

- The split does not dissolve them. Their derivations do not migrate into views.
- Views still never import them. The adapter reads the store and spreads the values onto the view as props.
- New derived-display logic goes into the view-model store or the adapter, never into the view.

**Why:** these stores are exactly the seam the extraction relies on. They keep business-state reads and display derivation in one testable place on the `packages/uniswap` side, so the view underneath can stay a pure function of props.

## Enforcement

| Layer | What it catches | Where |
| --- | --- | --- |
| `swap-ui-views` boundary | banned imports inside swap `views/` dirs (lint error) | `config/oxlint-plugins/import-boundaries.json`, activated for the swap tree in `oxlint.config.ts` |
| Movability ledger | every blocker class per view file, movable and adapter counts, batches | `scripts/swap-ui/ledger.ts`, run in CI by `.github/workflows/swap_ui_ledger.yml` |
| Drift pin | the fence can never deny an import the ledger calls clean | `scripts/swap-ui/ledger.test.ts` |

The ledger's blocker classes and how each one drains are defined in the ledger itself (`BLOCKER_DEFS`) and ship inside its JSON output, so downstream tooling never re-encodes them.
