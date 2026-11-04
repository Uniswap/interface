// Cross-subpath type-only import of the generated theme-key mirror — the same
// single source of truth `compat/color-tokens.ts` leans on (its sibling
// `theme-colors` layers the palette on top; the text-compat mirror
// is exactly `Object.keys(themes.light)`, pinned by tokens.parity.test.ts).
import type { ThemeColorToken } from '../text-compat/theme-tokens.generated'
import type { CompatThemeName } from '../theme-hooks-compat/theme-state'

/**
 * Drop-in for `ThemeName` as re-exported by `ui/src` — the same union the
 * compat theme hooks already carry, aliased rather than respelled.
 * Annotation-only. `packages/tailwind/src/parity/theme-name-keys` is the drift guard.
 */
export type ThemeName = CompatThemeName

/**
 * Drop-in for `ThemeKeys` as re-exported by `ui/src`: the key
 * set of the active Spore theme — the mycelium-native shape is
 * `SporeThemeKeys = keyof (typeof themes)['light']`
 * (`ui/src/theme/color/types.ts`). The generated `ThemeColorToken` union is
 * exactly `Object.keys(themes.light)` (pinned by tokens.parity.test.ts), so
 * this alias can never drift from the mirror without the parity suite going
 * red. Annotation-only. `packages/tailwind/src/parity/theme-name-keys` is the
 * drift guard.
 */
export type ThemeKeys = ThemeColorToken
