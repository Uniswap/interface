/**
 * Spore design-token maps for the Tamagui-compatible theme hooks. Colours come
 * from `palette.ts` (semantic values generated from @universe/tailwind theme.css).
 */
export { lookupToken } from '../compat/tokens'
export { DARK_THEME_COLORS, LIGHT_THEME_COLORS, THEME_COLOR_NAMES } from './theme-colors'
export type { ThemeColorName } from './theme-colors'

/**
 * Width breakpoints, declared in Tamagui's
 * media precedence order (`ui/src/theme/media.ts`, weakest first). Every
 * query is a max-*, so boundary values are inclusive.
 */
export const BREAKPOINT_PX = {
  xxxl: 1536,
  xxl: 1280,
  xl: 1024,
  lg: 768,
  md: 640,
  sm: 450,
  xs: 380,
  xxs: 360,
} as const

/** Height breakpoints. */
export const HEIGHT_BREAKPOINT_PX = {
  short: 736,
  midHeight: 800,
  lgHeight: 960,
} as const

export type MediaQueryKey = keyof typeof BREAKPOINT_PX | keyof typeof HEIGHT_BREAKPOINT_PX
