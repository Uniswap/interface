import { Platform } from 'react-native'
import { createFont, isWeb } from 'tamagui'

// make React Native font rendering more visually similar to the web and Figma
const adjustedSize = (fontSize: number): number => {
  if (Platform.OS === 'web') {
    return fontSize
  }
  return fontSize + 1
}

export const fonts = {
  headlineLarge: {
    family: 'book',
    fontSize: adjustedSize(52),
    lineHeight: 60,
    fontWeight: '400',
  },
  headlineMedium: {
    family: 'book',
    fontSize: adjustedSize(36),
    lineHeight: 44,
    fontWeight: '400',
  },
  headlineSmall: {
    family: 'book',
    fontSize: adjustedSize(24),
    lineHeight: 32,
    fontWeight: '400',
  },
  subheadLarge: {
    family: 'book',
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '400',
  },
  subheadSmall: {
    family: 'book',
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyLarge: {
    family: 'book',
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    family: 'book',
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMicro: {
    family: 'book',
    fontSize: adjustedSize(14),
    lineHeight: 16,
    fontWeight: '400',
  },
  buttonLabelLarge: {
    family: 'medium',
    fontSize: adjustedSize(20),
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonLabelMedium: {
    family: 'medium',
    fontSize: adjustedSize(18),
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonLabelSmall: {
    family: 'medium',
    fontSize: adjustedSize(16),
    lineHeight: 24,
    fontWeight: '500',
  },
  buttonLabelMicro: {
    family: 'medium',
    fontSize: adjustedSize(12),
    lineHeight: 16,
    fontWeight: '500',
  },
  monospace: {
    family: 'monospace',
    fontSize: adjustedSize(14),
    lineHeight: 20,
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
    large: fonts.headlineLarge.fontSize,
  },
  weight: {
    small: '500',
    medium: '500',
    large: '500',
  },
  lineHeight: {
    small: fonts.headlineSmall.lineHeight,
    medium: fonts.headlineMedium.lineHeight,
    large: fonts.headlineLarge.lineHeight,
  },
})

export const subHeadingFont = createFont({
  family: baselMedium,
  face: {},
  size: {
    small: fonts.subheadSmall.fontSize,
    large: fonts.subheadLarge.fontSize,
  },
  weight: {
    small: '500',
    medium: '500',
    large: '500',
  },
  lineHeight: {
    small: fonts.subheadSmall.lineHeight,
    large: fonts.subheadLarge.lineHeight,
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
  },
  weight: {
    small: '500',
    large: '500',
    micro: '500',
  },
  lineHeight: {
    small: fonts.bodySmall.lineHeight,
    large: fonts.bodyLarge.lineHeight,
    micro: fonts.bodyMicro.lineHeight,
    medium: fonts.bodySmall.lineHeight,
  },
})

export const buttonFont = createFont({
  family: baselBook,
  face: {},
  size: {
    small: fonts.buttonLabelSmall.fontSize,
    medium: fonts.buttonLabelMedium.fontSize,
    large: fonts.buttonLabelLarge.fontSize,
    micro: fonts.buttonLabelMicro.fontSize,
  },
  weight: {
    small: '500',
    medium: '500',
    large: '500',
    micro: '500',
  },
  lineHeight: {
    small: fonts.buttonLabelSmall.lineHeight,
    medium: fonts.buttonLabelMedium.lineHeight,
    large: fonts.buttonLabelLarge.lineHeight,
    micro: fonts.buttonLabelMicro.lineHeight,
  },
})

// TODO mono font
