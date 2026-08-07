/**
 * TS value mirror of this package's CSS custom properties (css/theme.css) so
 * TS consumers (e.g. `@universe/mycelium` token constants) can derive from the
 * token package instead of copying literals.
 *
 * Pinned to the CSS by the derivation honesty guard in `./tokens.guard.test.ts`
 * (and re-checked downstream by `packages/mycelium/src/tokens.parity.test.ts`):
 * any divergence between these values and css/theme.css fails those suites.
 * Only tokens the CSS actually defines belong here, with two documented
 * exceptions on `fonts` that have no sensible CSS representation (`family`,
 * `maxFontSizeMultiplier`).
 */
import type { BorderRadius, TypographyClass } from './types'

/** Border radius values in px, from the `--radius-*` custom properties. */
export const radii = {
  none: 0,
  '4': 4,
  '6': 6,
  '8': 8,
  '12': 12,
  '16': 16,
  '20': 20,
  '24': 24,
  '28': 28,
  '32': 32,
  full: 999999,
} as const satisfies Record<BorderRadius, number>

/** `text-body-1` → `body-1`: typography variant names as they appear in the `--text-*` custom properties. */
export type TypographyVariant = TypographyClass extends `text-${infer Variant}` ? Variant : never

/** One `--text-<variant>` scale entry; sizes in px, weight unitless. */
export interface TypographyToken {
  fontSize: number
  lineHeight: number
  fontWeight: number
  letterSpacing?: string
}

/** Typography scale from the `--text-*` custom properties. */
export const typography: Record<TypographyVariant, TypographyToken> = {
  'heading-1': { fontSize: 52, lineHeight: 50, fontWeight: 485, letterSpacing: '-0.02em' },
  'heading-2': { fontSize: 36, lineHeight: 40, fontWeight: 485, letterSpacing: '-0.01em' },
  'heading-3': { fontSize: 24, lineHeight: 28, fontWeight: 485, letterSpacing: '-0.005em' },
  'subheading-1': { fontSize: 18, lineHeight: 24, fontWeight: 485 },
  'subheading-2': { fontSize: 16, lineHeight: 24, fontWeight: 485 },
  'body-1': { fontSize: 18, lineHeight: 24, fontWeight: 485 },
  'body-2': { fontSize: 16, lineHeight: 24, fontWeight: 485 },
  'body-3': { fontSize: 14, lineHeight: 20, fontWeight: 485 },
  'body-4': { fontSize: 12, lineHeight: 16, fontWeight: 485 },
  'button-1': { fontSize: 18, lineHeight: 24, fontWeight: 535 },
  'button-2': { fontSize: 16, lineHeight: 24, fontWeight: 535 },
  'button-3': { fontSize: 14, lineHeight: 20, fontWeight: 535 },
  'button-4': { fontSize: 12, lineHeight: 16, fontWeight: 535 },
}

// ── ui/src/theme token-constant parity families (INFRA-2951) ───────────────
// Additive, value-identical imports of the ui token families so
// `@universe/mycelium` can derive its token constants from this package.

/** Icon sizes in px, from the `--icon-size-*` custom properties (ui iconSizes parity). */
export const iconSizes = {
  '8': 8,
  '12': 12,
  '14': 14,
  '16': 16,
  '18': 18,
  '20': 20,
  '24': 24,
  '28': 28,
  '32': 32,
  '36': 36,
  '40': 40,
  '44': 44,
  '48': 48,
  '56': 56,
  '64': 64,
  '70': 70,
  '100': 100,
} as const

/**
 * Spacing scale in px, from the `--ui-spacing-*` custom properties (ui spacing
 * parity). Not `--spacing-*`: that namespace would rebind the Tailwind
 * 4px-grid utilities (e.g. `p-12` would become 12px).
 */
export const spacing = {
  none: 0,
  '1': 1,
  '2': 2,
  '4': 4,
  '6': 6,
  '8': 8,
  '12': 12,
  '16': 16,
  '18': 18,
  '20': 20,
  '24': 24,
  '28': 28,
  '32': 32,
  '36': 36,
  '40': 40,
  '48': 48,
  '60': 60,
} as const

/** Z-index layers, from the `--z-index-*` custom properties (ui zIndexes parity). */
export const zIndexes = {
  negative: -1,
  background: 0,
  default: 1,
  mask: 10,
  dropdown: 970,
  header: 980,
  sidebar: 990,
  sticky: 1020,
  fixed: 1030,
  'modal-backdrop': 1040,
  offcanvas: 1050,
  modal: 1060,
  'popover-backdrop': 1065,
  popover: 1070,
  tooltip: 1080,
  overlay: 100010,
  toast: 100020,
} as const

/**
 * One `--typography-<variant>` entry: the ui fonts family as ui/src/theme/fonts.ts
 * resolves it on web. `family` (Tamagui font token) and `maxFontSizeMultiplier`
 * (React Native text-scaling cap) have no sensible CSS representation and live
 * only in this TS mirror; every other member is pinned to css/theme.css.
 */
export interface FontToken {
  family: 'book' | 'medium' | 'monospace'
  fontSize: number
  lineHeight: number
  /**
   * ui fonts-object value ('400'/'500'); absent on `monospace`, as in ui.
   * Web Tamagui text actually renders 485/535 via `createFont` defaultWeights —
   * styling live web text from this value would regress it. Reconciliation: #35388.
   */
  fontWeight?: string
  maxFontSizeMultiplier: number
  /**
   * ui's `%` encoding — not a valid CSS `letter-spacing` value (lengths only).
   * Never apply `var(--typography-*--letter-spacing)` directly; the usable
   * em-encoded values live in `--text-*`.
   */
  letterSpacing?: string
}

/** ui fonts variant names as they appear in the `--typography-*` custom properties. */
export type FontVariant =
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'subheading-1'
  | 'subheading-2'
  | 'body-1'
  | 'body-2'
  | 'body-3'
  | 'body-4'
  | 'body-5'
  | 'button-label-1'
  | 'button-label-2'
  | 'button-label-3'
  | 'button-label-4'
  | 'monospace'

/**
 * ui fonts parity values from the `--typography-*` custom properties. Distinct
 * from `typography` (the deliberately re-cut `--text-*` web scale): these carry
 * the ui/src/theme/fonts.ts values verbatim. Fractional line-heights are ui's
 * computed values (fontSize × ratio) at full float precision — required for
 * exact value equality in the INFRA-2951 exit test.
 */
export const fonts = {
  'heading-1': {
    family: 'book',
    fontSize: 52,
    lineHeight: 49.92,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-2%',
  },
  'heading-2': {
    family: 'book',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-1%',
  },
  'heading-3': {
    family: 'book',
    fontSize: 24,
    lineHeight: 28.799999999999997,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-0.5%',
  },
  'subheading-1': { family: 'book', fontSize: 18, lineHeight: 24, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'subheading-2': { family: 'book', fontSize: 16, lineHeight: 20, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'body-1': {
    family: 'book',
    fontSize: 18,
    lineHeight: 23.400000000000002,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  'body-2': { family: 'book', fontSize: 16, lineHeight: 20.8, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'body-3': { family: 'book', fontSize: 14, lineHeight: 18.2, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'body-4': { family: 'book', fontSize: 12, lineHeight: 16, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'body-5': { family: 'book', fontSize: 10, lineHeight: 12, fontWeight: '400', maxFontSizeMultiplier: 1.4 },
  'button-label-1': {
    family: 'medium',
    fontSize: 18,
    lineHeight: 20.7,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  'button-label-2': {
    family: 'medium',
    fontSize: 16,
    lineHeight: 18.4,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  'button-label-3': {
    family: 'medium',
    fontSize: 14,
    lineHeight: 16.099999999999998,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  'button-label-4': {
    family: 'medium',
    fontSize: 12,
    lineHeight: 13.799999999999999,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  monospace: { family: 'monospace', fontSize: 12, lineHeight: 16, maxFontSizeMultiplier: 1.2 },
} as const satisfies Record<FontVariant, FontToken>
