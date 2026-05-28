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

/** Mycelium color tokens */
export type ColorToken =
  | 'white'
  | 'black'
  | 'background'
  | 'neutral1'
  | 'neutral2'
  | 'neutral3'
  | 'surface1'
  | 'surface2'
  | 'surface3'
  | 'surface4'
  | 'surface5'
  | 'accent1'
  | 'accent2'
  | 'accent3'
  | 'accent4'
  | 'success'
  | 'critical'
  | 'warning'

/** Mycelium screen breakpoints */
export type Breakpoint = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'h-short' | 'h-mid'

/** Mycelium border radius tokens */
export type BorderRadius = 'none' | '4' | '6' | '8' | '12' | '16' | '20' | '24' | '28' | '32' | 'full'

/** Mycelium box shadow tokens */
export type BoxShadow = 'short' | 'medium' | 'large'
