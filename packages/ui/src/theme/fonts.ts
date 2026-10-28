import { isAndroid, isWebApp, isWebPlatform } from '@universe/environment'
import { needsSmallFont } from '@universe/mycelium/text-compat'
// Needed for the _Pin drift check below despite the re-export near the bottom (which creates no local binding) — both lines are required
import type { FontVariantToken } from 'ui/src/theme/fontVariants'

// TODO(EXT-148): remove this type and use Tamagui's FontTokens
export type TextVariantTokens = keyof typeof fonts

const adjustedSize = (fontSize: number): number => {
  if (needsSmallFont()) {
    return fontSize
  }
  return fontSize + 1
}

// Note that React Native is a bit weird with fonts
// on iOS you must refer to them by the family name in the file
// on Android you must refer to them by the name of the file
// on web, it's the full family name in the file
const fontFamilyByPlatform = {
  android: {
    medium: 'Basel-Grotesk-Medium',
    book: 'Basel-Grotesk-Book',
  },
  ios: {
    medium: 'Basel Grotesk',
    book: 'Basel Grotesk',
  },
  web: {
    medium: 'Basel Grotesk Medium',
    book: 'Basel Grotesk Book',
  },
}

const platform = isWebPlatform ? 'web' : isAndroid ? 'android' : 'ios'

const fontFamily = {
  serif: 'serif',
  sansSerif: {
    // iOS uses the name embedded in the font
    book: fontFamilyByPlatform[platform].book,
    medium: fontFamilyByPlatform[platform].medium,
    monospace: 'InputMono-Regular',
  },
}

export const baselMedium = isWebPlatform
  ? 'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : fontFamily.sansSerif.medium

export const baselBook = isWebPlatform
  ? 'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : fontFamily.sansSerif.book

export const monospaceFontFamily = isWebPlatform
  ? 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Courier New", monospace'
  : fontFamily.sansSerif.monospace

type SansSerifFontFamilyKey = keyof typeof fontFamily.sansSerif
type SansSerifFontFamilyValue = (typeof fontFamily.sansSerif)[SansSerifFontFamilyKey]

const platformFontFamily = (family: SansSerifFontFamilyKey): SansSerifFontFamilyKey | SansSerifFontFamilyValue => {
  if (isWebPlatform) {
    return family
  }

  return fontFamily.sansSerif[family]
}

// NOTE: these may not match the actual font weights in the figma files,
// but they are approved by design. If you want to change these or add new weights,
// please consult with the design team.

// default for non-button fonts
const BOOK_WEIGHT = '400'
const BOOK_WEIGHT_WEB = '485'

// used for buttons
const MEDIUM_WEIGHT = '500'
const MEDIUM_WEIGHT_WEB = '535'

export const defaultWeights = {
  book: isWebApp ? BOOK_WEIGHT_WEB : BOOK_WEIGHT,
  true: isWebApp ? BOOK_WEIGHT_WEB : BOOK_WEIGHT,
  medium: isWebApp ? MEDIUM_WEIGHT_WEB : MEDIUM_WEIGHT,
}

/** Button font weight — the `$true` weight in a `$button` font context. */
export const BUTTON_MEDIUM_WEIGHT = MEDIUM_WEIGHT

// on native, the Basel font files render down a few px
// this adjusts them to be visually centered by default
export const NATIVE_LINE_HEIGHT_SCALE = 1.15

// heading1/heading3/body1/body2/body3 line-heights are absolute px, not a ratio of the size:
// design requires whole-pixel line-boxes, so they must not be re-derived from adjustedSize.
export const fonts = {
  heading1: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(52),
    lineHeight: 50,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-2%',
  },

  heading2: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(36),
    lineHeight: 40,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-1%',
  },
  heading3: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(24),
    lineHeight: 28,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
    letterSpacing: '-0.5%',
  },
  subheading1: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  subheading2: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(16),
    lineHeight: 20,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body1: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body2: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(16),
    lineHeight: 22,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body3: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(14),
    lineHeight: 18,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body4: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(12),
    lineHeight: 16,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body5: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(10),
    lineHeight: 12,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  buttonLabel1: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(18),
    lineHeight: adjustedSize(18) * NATIVE_LINE_HEIGHT_SCALE,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel2: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(16),
    lineHeight: adjustedSize(16) * NATIVE_LINE_HEIGHT_SCALE,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel3: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(14),
    lineHeight: adjustedSize(14) * NATIVE_LINE_HEIGHT_SCALE,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel4: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(12),
    lineHeight: adjustedSize(12) * NATIVE_LINE_HEIGHT_SCALE,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  monospace: {
    family: platformFontFamily('monospace'),
    fontSize: adjustedSize(12),
    lineHeight: 16,
    maxFontSizeMultiplier: 1.2,
  },
} as const

// Tamagui-free defining file (INFRA-3290); re-exported here so `ui/src/theme` consumers are unchanged.
export type { FontVariantToken } from 'ui/src/theme/fontVariants'

type _Pin<T extends true> = T
/**
 * Compile-time pin (INFRA-3290): the Tamagui-free union in ./fontVariants.ts must stay exactly
 * `$<keyof typeof fonts>` — either drift direction fails typecheck here.
 */
type _FontVariantTokenIsPinnedToFonts = _Pin<
  [FontVariantToken] extends [`$${TextVariantTokens & string}`]
    ? [`$${TextVariantTokens & string}`] extends [FontVariantToken]
      ? true
      : false
    : false
>

/** Same keys as Text variant and fonts.* (no $). */
export type TextVariantKey = TextVariantTokens

/** Resolved font style for use in raw inline styles; family is the actual font stack, not a token. */
export interface ResolvedFontStyle {
  fontSize: number
  lineHeight: number
  family: string
  fontWeight: string
  letterSpacing?: string
}

function isTextVariantKey(key: string): key is TextVariantKey {
  return key in fonts
}

/**
 * Web `fonts.*.family` can be Tamagui tokens (`book`, `medium`); only raw DOM (e.g. AnimatedNumber digit
 * `<span>`s) needs a real font stack. Prefer `<Text variant>` elsewhere — no public export.
 */
function resolveFontFamilyForRawDomStyles(family: string): string {
  if (!isWebPlatform) {
    return family
  }
  if (family === 'book') {
    return baselBook
  }
  if (family === 'medium') {
    return baselMedium
  }
  if (family in fontFamily.sansSerif) {
    return String(fontFamily.sansSerif[family as SansSerifFontFamilyKey])
  }
  return family
}

function fontEntryToResolvedStyles(entry: (typeof fonts)[TextVariantKey]): ResolvedFontStyle {
  return {
    fontSize: entry.fontSize,
    lineHeight: entry.lineHeight,
    family: resolveFontFamilyForRawDomStyles(entry.family),
    // `fonts.monospace` has no fontWeight; match Text monospace variant (book).
    fontWeight: 'fontWeight' in entry ? entry.fontWeight : BOOK_WEIGHT,
    letterSpacing: 'letterSpacing' in entry ? entry.letterSpacing : undefined,
  }
}

/** Map a variant token to the Text variant prop (e.g. $heading2 → 'heading2'). */
export function getTextVariantKey(token: FontVariantToken): TextVariantKey {
  const key = token.slice(1)
  return isTextVariantKey(key) ? key : 'heading2'
}

/**
 * Resolve a variant token (e.g. $body3) for raw inline styles (e.g. AnimatedNumber digit rails).
 * Punctuation/loading should use `<Text variant={getTextVariantKey(token)}>`; this exists for non-Text DOM.
 */
export function getFontStylesForVariant(token: FontVariantToken): ResolvedFontStyle {
  return fontEntryToResolvedStyles(fonts[getTextVariantKey(token)])
}

/** Every `$variant` token from theme fonts (for Storybook selects, etc.). */
export const ALL_FONT_VARIANT_TOKENS = (Object.keys(fonts) as TextVariantTokens[]).map(
  (k) => `$${k}` as FontVariantToken,
)
