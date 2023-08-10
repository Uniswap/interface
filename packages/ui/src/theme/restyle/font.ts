import { fonts } from 'ui/src/theme/fonts'

export const fontFamily = {
  serif: 'serif',
  sansSerif: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    monospace: 'InputMono-Regular',
  },
}

// to make React Native's font rendering more consistent and more visually similar to the web and Figma
const addVisualFontAdjustment = (fontSize: number): number => {
  return fontSize + 1
}

export const textVariants = {
  headlineLarge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: fonts.headlineLarge.fontSize,
    lineHeight: fonts.headlineLarge.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  headlineMedium: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: fonts.headlineMedium.fontSize,
    lineHeight: fonts.headlineMedium.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  headlineSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: fonts.headlineSmall.fontSize,
    lineHeight: fonts.headlineSmall.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  subheadLarge: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: fonts.subheadLarge.fontSize,
    lineHeight: fonts.subheadLarge.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  subheadSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: addVisualFontAdjustment(fonts.subheadSmall.fontSize), // 14 -> 15
    lineHeight: fonts.subheadSmall.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodyLarge: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: addVisualFontAdjustment(fonts.bodyLarge.fontSize), // 16 -> 17
    lineHeight: fonts.bodyLarge.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodySmall: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: addVisualFontAdjustment(fonts.bodySmall.fontSize), // 14 -> 15
    lineHeight: fonts.bodySmall.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodyMicro: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: fonts.bodyMicro.fontSize,
    lineHeight: addVisualFontAdjustment(fonts.bodyMicro.lineHeight), // 16 -> 17
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  buttonLabelLarge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: fonts.buttonLabelLarge.fontSize,
    lineHeight: fonts.buttonLabelLarge.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMedium: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: addVisualFontAdjustment(fonts.buttonLabelMedium.fontSize), // 16 -> 17
    lineHeight: fonts.buttonLabelMedium.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelSmall: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: addVisualFontAdjustment(fonts.buttonLabelSmall.fontSize), // 14 -> 15
    lineHeight: fonts.buttonLabelSmall.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMicro: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: fonts.buttonLabelMicro.fontSize,
    lineHeight: addVisualFontAdjustment(fonts.buttonLabelMicro.lineHeight), // 16 -> 17
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  monospace: {
    fontFamily: fontFamily.sansSerif.monospace,
    fontSize: addVisualFontAdjustment(fonts.monospace.fontSize), // 14 -> 15
    lineHeight: fonts.monospace.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
}
