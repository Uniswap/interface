# LP regression test catalog (Casebook)

Primary interface is the **`casebook` Claude Code skill** (`/casebook`).
The script `scripts/casebook.ts` is plumbing and the future CI entry point.

**SSOT for editing:** `scenarios/*.md` + `_defaults.yaml`
**Generated (do not hand-edit):** `COVERAGE_MATRIX.md`. Testlio exports are written to `--output-dir` on demand and never committed.

## Layout

```text
packages/casebook/lp/
  _defaults.yaml            # area registry: product_area, nxProjects, platforms, label, ghLabel, reviewerTeam, wallets
  automation-backlog.yaml   # the team's prioritized automation plan (rendered by --automation-backlog)
  scenarios/                # one file per functionality
    create.md
    increase.md
    remove.md
    lifecycle.md
  COVERAGE_MATRIX.md        # generated — aligned coverage matrix
  updates/
    PR-<n>-review.md        # written by CI into the catalog companion PR, never by hand
```

Each case block: short YAML + one-line `> **summary**` + Given / When / Then.

## CI automation (trial)

Runs only when **both** are true:

1. PR diff touches **LP code paths** (union of scenario `code_paths` — not generic web).
2. At least one **existing catalog case** overlaps those LP file changes.

When the gate passes:

1. **`casebook:lp` label** is added (push again to re-run; label events do not re-trigger).
2. **PR comment** lists only the touched existing cases + LP files changed.
3. **Draft companion catalog PR** (`[Casebook] LP catalog for #N`) opens for `apps-lp` review only — no draft scenarios during trial.

Local gate check: `bun scripts/casebook.ts --branch --include-branch-commits --ci-gate --area lp.add_remove`

Search open catalog PRs: `is:open is:pr label:casebook:catalog-update`

## What Casebook does

1. **Analyze** a change (uncommitted / branch / release) → which existing cases cover it.
2. **Check coverage** via the matrix.
3. **Modify** a case when the change alters its description / steps / execution.
4. **Add** a case when new behavior isn't covered (existing cases are the template).
5. **Export** all or affected cases to Testlio.
6. **List** cases feasible to automate but not yet automated.

## Commands

```bash
bun casebook -- --branch --area lp.add_remove    # START HERE. Looks at the code you just changed (uncommitted) and tells you which existing QA tests cover it — so you know what to re-test — then helps you update or add cases (analyze → modify vs add → validate → generate → export)
bun casebook:matrix -- --area lp.add_remove     # The "what do we test, and where are the gaps?" table. One at-a-glance view of every LP test: what it checks, how critical it is, whether it's automated or still run by hand, and where it runs
bun casebook:gaps -- --area lp.add_remove       # Your automation backlog: manual tests that COULD be automated but aren't yet — i.e. things QA still checks by hand that a machine could
bun casebook:testlio -- --area lp.add_remove    # Exports the manual tests as a spreadsheet (CSV) ready to hand to Testlio (our outsourced QA testers) to execute
bun casebook:validate                          # Spellcheck for the test catalog: flags missing fields, duplicate IDs, and broken links before anyone relies on it
bun casebook:generate -- --area lp.add_remove   # Rebuilds the coverage table + Testlio spreadsheet from the catalog so they always match the source of truth (never edit those by hand)
```

Change scope:

```bash
# Full branch history (CI / release scope)
bun scripts/casebook.ts --branch --include-branch-commits --area lp.add_remove

# Release range
bun scripts/casebook.ts --range release/1.20.0...release/1.21.0 --area lp.add_remove

# Affected-only Testlio export (combine with a scope flag)
bun scripts/casebook.ts --testlio-export --affected --branch --area lp.add_remove
```

## Priority & severity (Linear-aligned)

`urgent` | `high` | `medium` | `low` — never legacy `P0`–`P3` / `S0`–`S2`. Validation rejects legacy labels.

Priority values follow Linear prioritization (`urgent`/`high`/`medium`/`low`) as the shared reference across teams and Testlio.

## Coverage matrix columns

`Functionality · ID · Title · Priority · Automated · Feasible · CI execution · Source`, plus a
per-functionality rollup. This is the single coverage view — no separate review sheet, no CSV matrix.

| Concept | Meaning |
|---------|---------|
| Automated = yes | Has `automationRefs` linked in-repo |
| Feasible = no | `automatable: false` (manual / Testlio only) |
| `ci_execution` | `pr-unit`, `pr-e2e`, `scheduled-anvil`, `scheduled-playwright`, `manual-only`, `none` |

`ci_execution` is derived from the cited tests and says where they actually run: `pr-*` on every
pull request; `scheduled-*` twice daily on weekdays (7 AM / 5 PM ET) plus `web/staging` pushes. The
only e2e that runs on PRs is the web smoketest spec and the extension suite, so `runFrequency:
pr-check` on any other e2e case is a validation error — use `scheduled`.

## Multiple areas (N-area framework)

Casebook is area-agnostic. Each regression-catalog area is a `testing/` directory anywhere
under `packages/**` containing a `scenarios/` folder and an `_defaults.yaml`. The engine derives a
per-area registry by scanning every `_defaults.yaml` (keyed by `product_area`), so reads and
generation work across N areas — see `packages/casebook/swap-core/` for
a second area.

Registry fields in `_defaults.yaml` (LP shown):

```yaml
product_area: lp.add_remove
label: LP                    # PR-comment / matrix / Testlio "Features" label
suiteNamePrefix: LP          # Testlio suite name prefix ("LP - …")
ghLabel: casebook:lp     # PR label applied by CI when the trial gate matches
reviewerTeam: apps-lp        # GitHub team requested on the catalog companion PR
```

Area-parametrized invocation — any command takes `--area <product_area>`:

```bash
bun scripts/casebook.ts --coverage-matrix --area swap.core
bun scripts/casebook.ts --generate-docs   --area swap.core
bun scripts/casebook.ts --testlio-export   --area swap.core
```

The `casebook:*` package scripts are thin wrappers around `bun scripts/casebook.ts`; pass `--area` after `--`.
`--validate` runs across all discovered areas.

## CI

Trial gate: an area's `code_paths` changed **and** existing cases touched (`--ci-gate --all-areas` in CI).
Gate uses `code_paths` overlap (not Nx graph expansion) for speed and precision.

CI is one workflow (`.github/workflows/casebook.yml`), called by the `ci.yml` orchestrator only when
the PR's diff touches a catalog, the engine, or a path some case covers (`CASEBOOK` in
`scripts/compute-affected.sh`) — PRs elsewhere in the monorepo never provision a runner for it. Its
`gate` job runs `--validate` across every catalog, then one engine call (`--ci-gate --all-areas`)
that gates every registered area and, for each area that qualifies, labels, comments and computes the
review doc in the same job, with `ghLabel`, `reviewerTeam`, comment marker, and companion-branch
prefix derived from each area's `_defaults.yaml`. Adding an area is a new catalog dir — no workflow
change.

When the gate passes, CI labels the PR + posts a comment and may open a draft catalog PR for the
area's reviewer team. The catalog companion targets the feature branch and is auto-closed when the
source PR closes — merge the catalog draft **before** the feature PR to avoid an orphaned companion.

LP Anvil e2e (`CreatePosition`, `IncreaseLiquidity`, `RemoveLiquidity`)
runs on `web/staging` + weekday cron (7 AM / 5 PM ET) — not on every PR, hence `runFrequency: scheduled`.
