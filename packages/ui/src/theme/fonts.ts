import { createFont, isWeb } from 'tamagui'

export const fonts = {
  headlineLarge: {
    fontSize: 40,
    lineHeight: 48,
  },
  headlineMedium: {
    fontSize: 32,
    lineHeight: 38,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 28,
  },
  subheadLarge: {
    fontSize: 20,
    lineHeight: 24,
  },
  subheadSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMicro: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonLabelLarge: {
    fontSize: 20,
    lineHeight: 24,
  },
  buttonLabelMedium: {
    fontSize: 16,
    lineHeight: 20,
  },
  buttonLabelSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonLabelMicro: {
    fontSize: 12,
    lineHeight: 16,
  },
  monospace: {
    fontSize: 14,
    lineHeight: 20,
  },
}

const interFontFamily = isWeb
  ? 'Inter, -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  : 'Inter'

export const headingFont = createFont({
  family: interFontFamily,
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
  family: interFontFamily,
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
  family: interFontFamily,
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
  family: interFontFamily,
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
