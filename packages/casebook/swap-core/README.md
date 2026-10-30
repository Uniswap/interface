# Swap regression catalog (Casebook)

Second Casebook area, proving the framework is area-agnostic. Same format and tooling as the
LP catalog — see the full docs in
`packages/casebook/lp/README.md`.

**SSOT for editing:** `scenarios/*.md` + `_defaults.yaml` (`product_area: swap.core`).
Generated (do not edit): `COVERAGE_MATRIX.md`. Testlio exports go to `--output-dir`, never into the repo.

```text
packages/casebook/swap-core/
  _defaults.yaml        # area registry (label, ghLabel, reviewerTeam, …)
  scenarios/*.md        # source of truth (frontmatter + Given/When/Then)
  COVERAGE_MATRIX.md    # generated
```

Commands (area-parametrized):

```bash
bun scripts/casebook.ts --validate                        # validates all areas
bun scripts/casebook.ts --coverage-matrix --area swap.core
bun scripts/casebook.ts --generate-docs   --area swap.core
bun scripts/casebook.ts --testlio-export  --area swap.core
```

CI: the single Casebook workflow (`.github/workflows/casebook.yml`) validates every catalog and
gates all areas in one engine call; this area's routing (label `casebook:swap`, reviewer `swap-fe`,
marker `## Casebook (Swap)`) is derived from `_defaults.yaml`, so no per-area workflow file exists.
