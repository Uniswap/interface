// until the web app needs all of tamagui, avoid heavy imports there
// biome-ignore lint/style/noRestrictedImports: until the web app needs all of tamagui, avoid heavy imports there
import { createFont, isAndroid } from '@tamagui/core'
import { needsSmallFont } from 'ui/src/utils/needs-small-font'
import { isWebApp, isWebPlatform } from 'utilities/src/platform'

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

const baselMedium = isWebPlatform
  ? 'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : fontFamily.sansSerif.medium

const baselBook = isWebPlatform
  ? 'Basel, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : fontFamily.sansSerif.book

const monospaceFontFamily = isWebPlatform
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

const defaultWeights = {
  book: isWebApp ? BOOK_WEIGHT_WEB : BOOK_WEIGHT,
  true: isWebApp ? BOOK_WEIGHT_WEB : BOOK_WEIGHT,
  medium: isWebApp ? MEDIUM_WEIGHT_WEB : MEDIUM_WEIGHT,
}

// on native, the Basel font files render down a few px
// this adjusts them to be visually centered by default
export const NATIVE_LINE_HEIGHT_SCALE = 1.15

export const fonts = {
  heading1: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(52),
    lineHeight: adjustedSize(52) * 0.96,
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
    lineHeight: adjustedSize(24) * 1.2,
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
    lineHeight: adjustedSize(18) * 1.3,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body2: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(16),
    lineHeight: adjustedSize(16) * 1.3,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body3: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(14),
    lineHeight: adjustedSize(14) * 1.3,
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

// TODO: Tamagui breaks font weights on Android if face *not* defined
// but breaks iOS if face is defined
const face = {
  [defaultWeights.book]: { normal: baselBook },
  [defaultWeights.medium]: { normal: baselMedium },
}

export const headingFont = createFont({
  family: baselBook,
  ...(isAndroid ? { face } : null),
  size: {
    small: fonts.heading3.fontSize,
    medium: fonts.heading2.fontSize,
    true: fonts.heading2.fontSize,
    large: fonts.heading1.fontSize,
  },
  weight: defaultWeights,
  lineHeight: {
    small: fonts.heading3.lineHeight,
    medium: fonts.heading2.lineHeight,
    true: fonts.heading2.lineHeight,
    large: fonts.heading1.lineHeight,
  },
})

export const subHeadingFont = createFont({
  family: baselBook,
  ...(isAndroid ? { face } : null),
  size: {
    small: fonts.subheading2.fontSize,
    large: fonts.subheading1.fontSize,
    true: fonts.subheading1.fontSize,
  },
  weight: defaultWeights,
  lineHeight: {
    small: fonts.subheading2.lineHeight,
    large: fonts.subheading1.lineHeight,
    true: fonts.subheading1.lineHeight,
  },
})

// for now tamagui is inferring all the font size from body, but we have differences in the diff fonts
// so i'm filling in blanks (adding medium here), but will need to fix this properly in tamagui...

export const bodyFont = createFont({
  family: baselBook,
  ...(isAndroid ? { face } : null),
  size: {
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    true: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
  },
  weight: defaultWeights,
  lineHeight: {
    micro: fonts.body4.lineHeight,
    small: fonts.body3.lineHeight,
    medium: fonts.body2.lineHeight,
    true: fonts.body2.lineHeight,
    large: fonts.body1.lineHeight,
  },
})

export const buttonFont = createFont({
  family: baselMedium,
  size: {
    micro: fonts.buttonLabel4.fontSize,
    small: fonts.buttonLabel3.fontSize,
    medium: fonts.buttonLabel2.fontSize,
    large: fonts.buttonLabel1.fontSize,
    true: fonts.buttonLabel2.fontSize,
  },
  weight: {
    ...defaultWeights,
    true: MEDIUM_WEIGHT,
  },
  lineHeight: {
    micro: fonts.buttonLabel4.lineHeight,
    small: fonts.buttonLabel3.lineHeight,
    medium: fonts.buttonLabel2.lineHeight,
    large: fonts.buttonLabel1.lineHeight,
    true: fonts.buttonLabel2.lineHeight,
  },
})

export const monospaceFont = createFont({
  family: monospaceFontFamily,
  size: {
    micro: fonts.body4.fontSize,
    small: fonts.body3.fontSize,
    medium: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
    true: fonts.body4.fontSize,
  },
  weight: defaultWeights,
  lineHeight: {
    micro: fonts.body4.lineHeight,
    small: fonts.body3.lineHeight,
    medium: fonts.body2.lineHeight,
    large: fonts.body1.lineHeight,
    true: fonts.body4.lineHeight,
  },
})

export const allFonts = {
  heading: headingFont,
  subHeading: subHeadingFont,
  body: bodyFont,
  button: buttonFont,
  monospace: monospaceFont,
}
