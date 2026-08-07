/**
 * Spore design-token maps for the Tamagui-compatible Flex prop API.
 * Values mirror `ui/src/theme`; the parity suite in
 * `packages/tailwind/src/parity` is the drift guard.
 */

export const SPACE_TOKEN_PX = {
  $none: 0,
  $true: 8,
  $spacing1: 1,
  $spacing2: 2,
  $spacing4: 4,
  $spacing6: 6,
  $spacing8: 8,
  $spacing12: 12,
  $spacing16: 16,
  $spacing18: 18,
  $spacing20: 20,
  $spacing24: 24,
  $spacing28: 28,
  $spacing32: 32,
  $spacing36: 36,
  $spacing40: 40,
  $spacing48: 48,
  $spacing60: 60,
  $padding6: 6,
  $padding8: 8,
  $padding12: 12,
  $padding16: 16,
  $padding20: 20,
  $padding24: 24,
  $padding36: 36,
  $gap4: 4,
  $gap8: 8,
  $gap12: 12,
  $gap16: 16,
  $gap20: 20,
  $gap24: 24,
  $gap32: 32,
  $gap36: 36,
} as const

export const RADIUS_TOKEN_PX = {
  $none: 0,
  $rounded4: 4,
  $rounded6: 6,
  $rounded8: 8,
  $rounded12: 12,
  $rounded16: 16,
  $rounded20: 20,
  $rounded24: 24,
  $rounded32: 32,
  $roundedFull: 999999,
} as const

/**
 * Spore color token → Tailwind semantic color utility suffix
 * (tokens come from `@universe/tailwind`'s web theme).
 */
export const COLOR_TOKEN_CLASS = {
  $white: 'white',
  $black: 'black',
  $transparent: 'transparent',
  $neutral1: 'neutral1',
  $neutral2: 'neutral2',
  $neutral3: 'neutral3',
  $surface1: 'surface1',
  $surface2: 'surface2',
  $surface3: 'surface3',
  $surface4: 'surface4',
  $surface5: 'surface5',
  $accent1: 'accent1',
  $accent2: 'accent2',
  $statusSuccess: 'success',
  $statusCritical: 'critical',
  $statusWarning: 'warning',
} as const

/**
 * Interaction-state color tokens whose `@universe/tailwind` counterparts are
 * raw light/dark pairs (no auto-switching semantic variable exists — the raw
 * utilities are already used directly across apps), so they compile to a
 * light utility plus a `dark:` override, matching the app-wide convention.
 */
export const THEMED_COLOR_TOKEN_CLASSES = {
  $surface1Hovered: { light: 'surface1-hovered', dark: 'surface1-hovered-dark' },
  $surface2Hovered: { light: 'surface2-hovered', dark: 'surface2-hovered-dark' },
  $surface3Hovered: { light: 'surface3-hovered', dark: 'surface3-hovered-dark' },
} as const

export type SporeSpaceToken = keyof typeof SPACE_TOKEN_PX
export type SporeRadiusToken = keyof typeof RADIUS_TOKEN_PX
export type SporeColorToken = keyof typeof COLOR_TOKEN_CLASS | keyof typeof THEMED_COLOR_TOKEN_CLASSES

/**
 * Token maps are closed const objects, so `keyof`-indexed lookups never type
 * as undefined — but at runtime props can carry arbitrary strings. Widens the
 * lookup so a miss is reachable in the type system too.
 */
export function lookupToken<V>(map: Readonly<Record<string, V>>, key: string): V | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined
}
