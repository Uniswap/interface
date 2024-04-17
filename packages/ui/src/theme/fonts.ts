// until the web app needs all of tamagui, avoid heavy imports there
// eslint-disable-next-line no-restricted-imports
import { createFont, isWeb } from '@tamagui/core'
import { needsSmallFont } from 'ui/src/utils/needs-small-font'

// TODO(EXT-148): remove this type and use Tamagui's FontTokens
export type TextVariantTokens = keyof typeof fonts

const adjustedSize = (fontSize: number): number => {
  if (needsSmallFont()) {
    return fontSize
  }
  return fontSize + 1
}

const fontFamily = {
  serif: 'serif',
  sansSerif: {
    // iOS uses the name embedded in the font
    book: 'Basel-Book',
    medium: 'Basel-Medium',
    monospace: 'InputMono-Regular',
  },
}

type SansSerifFontFamilyKey = keyof typeof fontFamily.sansSerif
type SansSerifFontFamilyValue = (typeof fontFamily.sansSerif)[SansSerifFontFamilyKey]

const platformFontFamily = (
  family: SansSerifFontFamilyKey
): SansSerifFontFamilyKey | SansSerifFontFamilyValue => {
  if (isWeb) {
    return family
  }

  return fontFamily.sansSerif[family]
}

const BOOK_WEIGHT = '400'
const MEDIUM_WEIGHT = '500'

export const fonts = {
  heading1: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(52),
    lineHeight: 60,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  heading2: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(36),
    lineHeight: 44,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  heading3: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(24),
    lineHeight: 32,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.2,
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
    lineHeight: 24,
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
    lineHeight: 24,
    fontWeight: BOOK_WEIGHT,
    maxFontSizeMultiplier: 1.4,
  },
  body3: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(14),
    lineHeight: 20,
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
    fontSize: adjustedSize(20),
    lineHeight: 24,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel2: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel3: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabel4: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(14),
    lineHeight: 16,
    fontWeight: MEDIUM_WEIGHT,
    maxFontSizeMultiplier: 1.2,
  },
  monospace: {
    family: platformFontFamily('monospace'),
    fontSize: adjustedSize(14),
    lineHeight: 20,
    maxFontSizeMultiplier: 1.2,
  },
} as const

const baselMedium = isWeb
  ? 'Basel-Medium, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : 'Basel-Medium'

const baselBook = isWeb
  ? 'Basel-Book, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : 'Basel-Book'

export const headingFont = createFont({
  family: baselBook,
  face: {},
  size: {
    small: fonts.heading3.fontSize,
    medium: fonts.heading2.fontSize,
    true: fonts.heading2.fontSize,
    large: fonts.heading1.fontSize,
  },
  weight: {
    book: '400',
    medium: '500',
    true: fonts.heading1.fontWeight,
  },
  lineHeight: {
    small: fonts.heading3.lineHeight,
    medium: fonts.heading2.lineHeight,
    true: fonts.heading2.lineHeight,
    large: fonts.heading1.lineHeight,
  },
})

export const subHeadingFont = createFont({
  family: baselBook,
  face: {},
  size: {
    small: fonts.subheading2.fontSize,
    large: fonts.subheading1.fontSize,
    true: fonts.subheading1.fontSize,
  },
  weight: {
    book: '400',
    medium: '500',
    true: fonts.subheading1.fontWeight,
  },
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
  face: {},
  size: {
    micro: fonts.body3.fontSize,
    small: fonts.body2.fontSize,
    medium: fonts.body2.fontSize,
    large: fonts.body1.fontSize,
    true: fonts.body2.fontSize,
  },
  weight: {
    book: '400',
    medium: '500',
    true: fonts.body1.fontWeight,
  },
  lineHeight: {
    micro: fonts.body3.lineHeight,
    small: fonts.body2.lineHeight,
    medium: fonts.body2.lineHeight,
    large: fonts.body1.lineHeight,
    true: fonts.body2.lineHeight,
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
    book: '400',
    medium: '500',
    true: fonts.buttonLabel1.fontWeight,
  },
  lineHeight: {
    micro: fonts.buttonLabel4.lineHeight,
    small: fonts.buttonLabel3.lineHeight,
    medium: fonts.buttonLabel2.lineHeight,
    large: fonts.buttonLabel1.lineHeight,
    true: fonts.buttonLabel2.lineHeight,
  },
})

// TODO mono font

export const allFonts = {
  heading: headingFont,
  subHeading: subHeadingFont,
  body: bodyFont,
  button: buttonFont,
}
