// Cross-subpath type-only import of the generated Spore mirror — single source
// of truth for the 148 `$` names. That module has no imports of its own, so
// there is no cycle back into ./tokens.
import type { ThemeColorName } from '../theme-hooks-compat/theme-colors'
import type { CssColorName } from './css-color-names.generated'

/**
 * Drop-in for `ColorTokens` as re-exported by `ui/src` (INFRA-3228): exactly
 * mutually assignable with it, so an annotation converts by swapping the import
 * source alone. Tamagui's union is closed — (148 `$` Spore names) ∪ (148 CSS
 * keywords), no residue either way — so both halves are required. The CSS half
 * costs nothing at runtime: unknown non-`$` strings pass through `colorClasses`
 * as an arbitrary-value class (./style-classes.ts:59-62).
 *
 * Interop/annotation type only — parameters, returns, locals. NOT a prop type:
 * 129 of the 148 `$` names have no `@universe/tailwind` counterpart and throw at
 * render, so never widen `ColorValue`, `IconProps['color']` or
 * `TextCompatProps['color']` to it. `packages/tailwind/src/parity/color-tokens`
 * is the drift guard.
 */
export type ColorTokens = `$${ThemeColorName}` | CssColorName
