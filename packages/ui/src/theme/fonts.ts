import { Platform } from 'react-native'
import { createFont, isWeb } from 'tamagui'

// make React Native font rendering more visually similar to the web and Figma
const adjustedSize = (fontSize: number): number => {
  if (Platform.OS === 'web') {
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
  if (Platform.OS === 'web') {
    return family
  }

  return fontFamily.sansSerif[family]
}

export const fonts = {
  headlineLarge: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(52),
    lineHeight: 60,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  headlineMedium: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(36),
    lineHeight: 44,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  headlineSmall: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(24),
    lineHeight: 32,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.2,
  },
  subheadLarge: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  subheadSmall: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  bodyLarge: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  bodySmall: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  bodyMicro: {
    family: platformFontFamily('book'),
    fontSize: adjustedSize(14),
    lineHeight: 16,
    fontWeight: '400',
    maxFontSizeMultiplier: 1.4,
  },
  buttonLabelLarge: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(20),
    lineHeight: 24,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMedium: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelSmall: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '500',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMicro: {
    family: platformFontFamily('medium'),
    fontSize: adjustedSize(12),
    lineHeight: 16,
    fontWeight: '500',
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
  family: baselMedium,
  face: {},
  size: {
    small: fonts.headlineSmall.fontSize,
    medium: fonts.headlineMedium.fontSize,
    true: fonts.headlineMedium.fontSize,
    large: fonts.headlineLarge.fontSize,
  },
  weight: {
    small: '500',
    medium: '500',
    true: '500',
    large: '500',
  },
  lineHeight: {
    small: fonts.headlineSmall.lineHeight,
    medium: fonts.headlineMedium.lineHeight,
    true: fonts.headlineMedium.lineHeight,
    large: fonts.headlineLarge.lineHeight,
  },
})

export const subHeadingFont = createFont({
  family: baselBook,
  face: {},
  size: {
    small: fonts.subheadSmall.fontSize,
    large: fonts.subheadLarge.fontSize,
    true: fonts.subheadLarge.fontSize,
  },
  weight: {
    small: '500',
    medium: '500',
    large: '500',
    true: '500',
  },
  lineHeight: {
    small: fonts.subheadSmall.lineHeight,
    large: fonts.subheadLarge.lineHeight,
    true: fonts.subheadLarge.lineHeight,
  },
})

// for now tamagui is inferring all the font size from body, but we have differences in the diff fonts
// so i'm filling in blanks (adding medium here), but will need to fix this properly in tamagui...

export const bodyFont = createFont({
  family: baselBook,
  face: {},
  size: {
    small: fonts.bodySmall.fontSize,
    large: fonts.bodyLarge.fontSize,
    micro: fonts.bodyMicro.fontSize,
    medium: fonts.bodySmall.fontSize,
    true: fonts.bodySmall.fontSize,
  },
  weight: {
    small: fonts.bodySmall.fontWeight,
    large: fonts.bodyLarge.fontWeight,
    micro: fonts.bodyMicro.fontWeight,
    medium: fonts.bodySmall.fontWeight,
    true: fonts.bodySmall.fontWeight,
  },
  lineHeight: {
    small: fonts.bodySmall.lineHeight,
    large: fonts.bodyLarge.lineHeight,
    micro: fonts.bodyMicro.lineHeight,
    medium: fonts.bodySmall.lineHeight,
    true: fonts.bodySmall.lineHeight,
  },
})

export const buttonFont = createFont({
  family: baselMedium,
  size: {
    small: fonts.buttonLabelSmall.fontSize,
    medium: fonts.buttonLabelMedium.fontSize,
    large: fonts.buttonLabelLarge.fontSize,
    micro: fonts.buttonLabelMicro.fontSize,
    true: fonts.buttonLabelMedium.fontSize,
  },
  weight: {
    small: fonts.buttonLabelSmall.fontWeight,
    medium: fonts.buttonLabelMedium.fontWeight,
    large: fonts.buttonLabelLarge.fontWeight,
    micro: fonts.buttonLabelMicro.fontWeight,
    true: fonts.buttonLabelMedium.fontWeight,
  },
  lineHeight: {
    small: fonts.buttonLabelSmall.lineHeight,
    medium: fonts.buttonLabelMedium.lineHeight,
    large: fonts.buttonLabelLarge.lineHeight,
    micro: fonts.buttonLabelMicro.lineHeight,
    true: fonts.buttonLabelMedium.lineHeight,
  },
})

// TODO mono font
