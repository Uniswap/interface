# Tamagui → Mycelium conversion codemod

Part of the Tamagui → Tailwind migration tooling (Linear project "Tamagui to Tailwind Migration", INFRA-2957). The converted-directory ratchet lives in `../ratchet/`.

Conversion is an **import-path swap, not a rewrite**: a `ui/src` import statement is swapped to `@universe/mycelium` only when the *whole statement* is convertible. The compat primitives (`Flex`, `Text`, `TouchableArea`) accept the full legacy prop surface, so specifiers and props are left byte-identical — the typechecker proves the contract after the swap.

```bash
# Dry-run (default) — prints would-convert / manual-lane / clean
bun scripts/tamagui-migration/codemod/cli.ts apps/web/src/pages/Swap

# Apply, machine-readable report
bun scripts/tamagui-migration/codemod/cli.ts apps/web/src/pages/Swap --write --json
```

What converts:

- `import { Flex, Text } from 'ui/src'` → `import { Flex, Text } from '@universe/mycelium'`
- `import { X } from 'ui/src/components/icons/X'` → `import { X } from '@universe/mycelium/icons/X'`

Anything partial routes the **entire file** to the manual lane, untouched:

| Reason | Trigger |
| --- | --- |
| `mixed-import-statement` | statement mixes convertible and non-convertible specifiers (incl. a default binding next to convertible named ones) |
| `unconvertible-import` | statement has no mycelium counterpart: deep paths, namespace/default/type-only imports, `export ... from 'ui/src'` re-exports, dynamic `import('ui/src')` |
| `styled-call` | `styled(...)` usage |
| `animation-prop` | `animation=` JSX prop |
| `group-state-prop` | `$group-*` JSX props |
| `spread-props` | JSX spread attributes |

Partial conversions are never attempted because a mechanical half-swap can silently change behavior — e.g. the responsive-breakpoint sign flip (Tamagui is desktop-first `maxWidth`, Tailwind is mobile-first `min-width`).

The convertible-specifier list and manual-lane rules live in `rules.ts` (ast-grep rules); the driver in `driver.ts`.

## Fixture suite (`fixtures/`)

Input/expected pairs covering every conversion shape and every manual-lane flag case. The suite is the migration's week-2 exit test:

```bash
bun test scripts/tamagui-migration
```

Fixture contract (per directory): `input.tsx` always; `expected.tsx` → must convert to exactly that output; `expected.flags.json` → must flag with exactly those reasons and leave the file untouched; neither → must report clean.
