/** Typography class names for tailwind-merge conflict resolution */
export const typographyClasses = [
  'text-body-1',
  'text-body-2',
  'text-body-3',
  'text-body-4',
  'text-heading-1',
  'text-heading-2',
  'text-heading-3',
  'text-subheading-1',
  'text-subheading-2',
  'text-button-1',
  'text-button-2',
  'text-button-3',
  'text-button-4',
] as const

/** Mycelium typography class type */
export type TypographyClass = (typeof typographyClasses)[number]

/**
 * Mycelium color tokens.
 *
 * `'background'`, the deprecated `'accent3'`/`'accent3-hovered'` neutral1
 * aliases, and `'accent4'` are web-only:
 * native.css generates no utility class for them, so they must not be used in
 * React Native (uniwind) code.
 */
export type ColorToken =
  | 'white'
  | 'black'
  | 'background'
  | 'neutral1'
  | 'neutral1-hovered'
  | 'neutral2'
  | 'neutral2-hovered'
  | 'neutral3'
  | 'neutral3-hovered'
  | 'surface1'
  | 'surface1-hovered'
  | 'surface2'
  | 'surface2-hovered'
  | 'surface3'
  | 'surface3-hovered'
  | 'surface3-solid'
  | 'surface4'
  | 'surface5'
  | 'surface5-hovered'
  | 'accent1'
  | 'accent1-hovered'
  | 'accent2'
  | 'accent2-hovered'
  | 'accent2-solid'
  // deprecated: aliases of neutral1 — remove when legacy Tamagui accent3 is gone
  | 'accent3'
  | 'accent3-hovered'
  | 'accent4'
  | 'success'
  | 'success-hovered'
  | 'success-secondary'
  | 'success-secondary-hovered'
  | 'critical'
  | 'critical-hovered'
  | 'critical-secondary'
  | 'critical-secondary-hovered'
  | 'warning'
  | 'warning-hovered'
  | 'warning-secondary'
  | 'warning-secondary-hovered'

/** Mycelium screen (width) breakpoints */
export type Breakpoint = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl'

/**
 * Mycelium height breakpoints (max-height variants defined in css/base.css,
 * mirroring packages/ui/src/theme/breakpoints.ts heightBreakpoints).
 */
export type HeightBreakpoint = 'h-short' | 'h-mid'

/** Mycelium border radius tokens */
export type BorderRadius = 'none' | '4' | '6' | '8' | '12' | '16' | '20' | '24' | '28' | '32' | 'full'

/** Mycelium box shadow tokens */
export type BoxShadow = 'short' | 'medium' | 'large'
