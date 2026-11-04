/**
 * Platform-independent half of the legacy `ui/src/theme` font machinery
 * (fonts.ts `getTextVariantKey` / `getFontStylesForVariant` /
 * `ALL_FONT_VARIANT_TOKENS` and their types), ported for converted call sites
 * that style raw non-Text nodes (e.g. AnimatedNumber digit rails). The
 * platform legs live in `font-variant.{ts,web.ts,native.ts}`; only
 * `getFontStylesForVariant` differs per platform (web reads the generated
 * mirror, native reads the adjusted ramp in `./native-font`).
 *
 * Values are transcribed from `packages/ui/src/theme/fonts.ts` — mycelium
 * must never depend on `packages/ui` — and `font-variant.test.ts` pins them
 * against independent literals (the INFRA-3461 replicated-constants pattern).
 */
import type { FontVariantToken } from '@universe/tailwind/types'
import { WEB_BASEL_FONT_STACK } from '../token-constants'
import { VARIANT_METRICS, type TextVariant } from './theme-tokens.generated'

/** Same keys as the Text `variant` prop and the legacy fonts table (no `$`). */
export type TextVariantKey = TextVariant

/**
 * Resolved font style for raw inline styles; `family` is an actual font
 * stack / platform font name, never a token. Same shape as the legacy
 * `ResolvedFontStyle` (fonts.ts).
 */
export interface ResolvedFontStyle {
  fontSize: number
  lineHeight: number
  family: string
  fontWeight: string
  letterSpacing?: string
}

function isTextVariantKey(key: string): key is TextVariantKey {
  return key in VARIANT_METRICS
}

/** Map a variant token to the Text `variant` prop (e.g. `$heading2` becomes 'heading2'). */
export function getTextVariantKey(token: FontVariantToken): TextVariantKey {
  const key = token.slice(1)
  // The legacy resolver's fallback for out-of-set tokens, kept verbatim.
  return isTextVariantKey(key) ? key : 'heading2'
}

/** Every `$variant` token from the theme fonts (for Storybook selects, etc.). */
export const ALL_FONT_VARIANT_TOKENS: FontVariantToken[] = (Object.keys(VARIANT_METRICS) as TextVariantKey[]).map(
  (key) => `$${key}` as FontVariantToken,
)

/**
 * fonts.ts per-variant letterSpacing (headings only; percentage strings,
 * platform-independent). Absent entries resolve to `undefined`, as legacy.
 */
export const VARIANT_LETTER_SPACING: Partial<Record<TextVariantKey, string>> = {
  heading1: '-2%',
  heading2: '-1%',
  heading3: '-0.5%',
}

/**
 * The fonts-table weights: '400' for the book/mono variants, '500' for the
 * medium (buttonLabel) variants — on EVERY platform. The legacy resolver
 * reads `fonts.*.fontWeight`, which carries these nominal weights; the
 * 485/535 web-app weights live in the separate `defaultWeights` table the
 * className lane mirrors (`VARIANT_METRICS.fontWeight`), and never reach
 * `ResolvedFontStyle`.
 */
export function fontsTableWeight(variant: TextVariantKey): string {
  return VARIANT_METRICS[variant].family === 'medium' ? '500' : '400'
}

/**
 * Legacy web resolution for the mono variant: `resolveFontFamilyForRawDomStyles`
 * falls through to the raw sansSerif table, which holds the mono FILE name —
 * not the ui-monospace stack the className lane uses. Kept verbatim.
 */
const WEB_MONO_FAMILY = 'InputMono-Regular'

/**
 * The web resolution of `getFontStylesForVariant` — shared by the platformless
 * base leg and the web leg (both deterministic, like `native-font-environment`).
 */
export function webFontStylesForVariant(token: FontVariantToken): ResolvedFontStyle {
  const key = getTextVariantKey(token)
  const metrics = VARIANT_METRICS[key]
  return {
    fontSize: metrics.fontSize,
    lineHeight: metrics.lineHeight,
    family: metrics.family === 'mono' ? WEB_MONO_FAMILY : WEB_BASEL_FONT_STACK,
    fontWeight: fontsTableWeight(key),
    letterSpacing: VARIANT_LETTER_SPACING[key],
  }
}
