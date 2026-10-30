# swap-ui extraction guide (per-batch contract)

You are extracting a batch of swap view components into `@universe/swap-ui`. One Linear
issue = one batch = one working session = one PR. The issue carries your file list;
this guide carries the rules. If the two disagree, regenerate the ledger and trust it,
then note the drift on the issue.

An extraction is a **move plus a props redesign, never a behavior change**. The old flow
keeps rendering the same pixels through a thin adapter you write. If you find yourself
changing what a component does, stop: that is a separate PR, owned by a maintainer.

## Preflight (before touching code)

```bash
gh auth status                                # no GitHub access = cannot ship; stop and say so
bun scripts/swap-ui/ledger.ts --files         # confirm your batch files and their blocker classes
```

- Check each file's blocker classes. `store-read`, `flags`, `telemetry`,
  `modal-shell`, `uniswap-runtime`, `types-pending` are your normal work. `ui-src` means
  the file imports the legacy `ui/src` component library, which swap-ui cannot depend
  on. Tamagui itself is gone from the repo, so there is no styling to convert, only
  imports. For each `ui/src` import:

  - A primitive with a mycelium equivalent (`Flex`, `Text`, `Button`, `TouchableArea`,
    icons at `@universe/mycelium/icons/<Name>`, logos at `/logos/<Name>`, svg assets at
    `/assets/...`, hooks at `/theme-hooks-compat`): swap the import line, same props.
    Confirm the file exists under `packages/mycelium/src` first.
  - A component with no mycelium leg (`RoutingLabel`, `UniswapXText`, `RoutingDiagram`,
    the dotted separator, the full Across wordmark): it stays in the adapter and reaches
    the view as a slot. Count it against the slot budget.
  - `Trans`: the raw react-i18next import is banned and the escaping one lives in
    `ui/src/i18n`, which swap-ui cannot import. The adapter composes the translated node
    and passes it in; the view only places it. `RoutingCaption` shows the shape.
- If any file imports `useBottomSheetInternal`, reanimated shared values, or anything
  under `TransactionModal`/`CurrentScreen`: it is shell-tier and exempt. Remove it from
  your batch and note it on the issue.
- Read `packages/swap-ui/src/types/` (the prop vocabulary) and `scripts/swap-ui/OWNERSHIP.md`.
- Post your starting state as a Linear comment. A dead session with its state on the
  issue is a cheap redispatch; one without is a full redo.

## Step 1: understand the view

For each file, list every value and callback it consumes (store selectors, hooks,
context reads). The ledger's per-file blocker detail is your starting inventory.
Then find its consumers:

```bash
grep -rn "from '.*<ComponentName>'" packages apps --include='*.tsx' | grep -v test
```

Most views have exactly one consumer. A view consumed outside your batch's directory
needs a coordination note on the issue before you move it.

## Step 2: design the props (the one creative step; reviewed hardest)

Props use the package vocabulary in `packages/swap-ui/src/types/` (`TokenDisplay`,
`AmountDisplay`, `SwapWarningDisplay`, ...). Rules:

- **Data arrives display-ready.** Formatted strings, booleans, small enums. The
  aggregates never cross: no `DerivedSwapInfo`, no `CurrencyInfo`, no `GasFeeResult`,
  no `Warning`. Decompose them in the adapter.
- **Allowed type imports:** the package itself, `@universe/mycelium`, `@universe/api`
  (wire types, read-only), `@uniswap/sdk-core`, `@universe/chains`, `utilities`
  (never its telemetry). Nothing from `uniswap/src` or `ui/src`, ever, including
  `import type`.
- **Callbacks** are `onX` props. The view never decides what a press means.
- **Slots** (`ReactNode` props) for heavy shared components the view composes but must
  not import. More than 4 slots means the split is wrong: escalate.
- **Prop-count sanity:** roughly the fields the view renders. If decomposing an
  aggregate balloons the count past ~1.5x the old props/store fields, stop and
  escalate. That is a boundary-design problem, not an extraction problem.

## Step 3: move the view

```bash
git mv <old path> packages/swap-ui/src/<family>/
bunx nx sync        # ALWAYS after files/deps change; commit the tsconfig updates in the batch
```

Rewrite the view against the new props. Mycelium imports stay as they are. Every
`uniswap/src` import must disappear into a prop you designed in step 2.

## Step 4: write the adapter (stays in packages/uniswap)

Same exported name and location as the old component, so consumers change nothing.
The adapter reads exactly the stores and hooks the old component read, maps them onto
the new props, and renders the view:

- **Pure mapping only.** No new branching, no new hooks beyond the
  formatting/localization the old component already used.
- Derivation the old component did in render (`getSwapFeeUsd(...)`, routing checks)
  moves verbatim into the adapter, above the JSX.
- Analytics wrappers (`Trace`, `send*`) stay on the adapter side, composed around the
  view. The view emits callbacks; the adapter logs.

## Step 5: story

`<View>.stories.tsx` colocated in swap-ui, one story per meaningful state: loading,
each warning severity the view can show, each routing variant it branches on. Fixtures
are plain objects. **If a story needs a store mock, the props are wrong: go back to
step 2.**

## Step 6: test (all of this, every batch)

| Gate | Command / action | Pass bar |
| --- | --- | --- |
| Typecheck + lint fast loop | `bun nx affected -t check:fast` | green while editing |
| Batch's own unit tests | `bunx nx test uniswap -- <old dir>` and `bunx nx test swap-ui` | green; moved render tests use props fixtures, hook tests stay adapter-side |
| Full gate | `bun nx affected -t check` | green before the PR |
| Boundary self-check | `bun scripts/swap-ui/ledger.ts --files \| grep <your files>` + grep your views for `uniswap/src`, `ui/src`, `@universe/gating`, `@tanstack/react-query`, telemetry | zero hits in view files; your adapters print `ADAPTER` |
| Boundary positive control | add a temp `uniswap/src` import to one view, confirm lint fails, delete it (verify `git status` is clean before continuing) | the rule actually fired |
| **Zero-pixel evidence (executed, not staged)** | replay the canonical recorded flows per `scripts/swap-ui/EVIDENCE.md`: argent flow replay on iOS sim, Playwright canonical states on the deployed web preview (never a local dev server), extension per recipe. Capture on base and head, pixel-diff | **zero diff.** In M1 there are no intentional pixel changes: any diff is a bug in your extraction. If you cannot explain a diff within an hour, post it on the issue and stop; never fix a diff by tweaking styles |
| Interaction e2e | run the recipe's flows for the surfaces your batch touches: keyboard attach/detach, tap targets on changed views, form/review transition when applicable | flows green on head |
| Stories | storybook renders your stories, light and dark | no crashes, both themes |

"I couldn't take a screenshot" is not an accepted reason (established migration
precedent). If a leg genuinely cannot be produced, the PR body says so plainly and the
issue gets a comment, instead of the evidence going quiet.

## Step 7: PR

- Branch on your batch's gh-stack stack, sequenced; restack when a base changes.
- Title: `refactor(swap-ui): extract <dir> views [SWAP-XXXX]`.
- Body: file list; per-view prop design note (old fields vs new props, one line each);
  the evidence table (before | after | diff images uploaded straight into the PR with
  `gh pr edit <n> --attach ./before.png --attach ./after.png`, alt text via
  `'./after.png#what it shows'`; needs gh 2.99+); test output; ledger delta.
- Label `swap-ui-extraction`, assign the requesting engineer, arm auto-merge:
  `gh pr merge --auto --squash`. Reviewers merge; you never merge your own PR.

## Step 8: Linear

Comment with counts (extracted, deferred with named blockers, escalations), attach the
PR, move to In Review. Decisions live on the issue, never only in a thread.

## Stop conditions (escalate on the issue, do not improvise)

1. Reaching props requires a logic change → stop; separate PR or the file stays.
2. Prop count balloons past ~1.5x → stop; boundary design escalation.
3. `ui-src` import with no mycelium equivalent and no clean slot → stop; note it on the issue.
4. View wants a 5th slot → stop; it is a layout shell, wrong split.
5. Unexplained pixel diff after an hour → post it, stop.
6. Shell-tier file in your batch → remove it, note it. Never touch the flag mount
   points, `TransactionModal`, `CurrentScreen`, decimal pad internals, or the footer.

## Bright lines

1. The old flow's logic is never edited. Adapters are mappings.
2. `swap-ui` never imports `uniswap/src` or `ui/src`, including types.
3. Merged views are append-only: prop changes go through a maintainer.
4. Evidence is executed, attached, and reproducible, or the PR is not ready.
5. One issue = one session = one PR. Never reuse a session for a second batch.
