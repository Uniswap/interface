import { fonts } from 'ui/src/theme/fonts'

const fontFamily = {
  serif: 'serif',
  sansSerif: {
    // ios uses the name embedded in the font
    book: 'Basel-Book',
    medium: 'Basel-Medium',
    monospace: 'InputMono-Regular',
  },
}

export const textVariants = {
  headlineLarge: {
    fontFamily: fontFamily.sansSerif[fonts.headlineLarge.family],
    fontSize: fonts.headlineLarge.fontSize,
    lineHeight: fonts.headlineLarge.lineHeight,
    fontWeight: fonts.headlineLarge.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  headlineMedium: {
    fontFamily: fontFamily.sansSerif[fonts.headlineMedium.family],
    fontSize: fonts.headlineMedium.fontSize,
    lineHeight: fonts.headlineMedium.lineHeight,
    fontWeight: fonts.headlineMedium.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  headlineSmall: {
    fontFamily: fontFamily.sansSerif[fonts.headlineSmall.family],
    fontSize: fonts.headlineSmall.fontSize,
    lineHeight: fonts.headlineSmall.lineHeight,
    fontWeight: fonts.headlineSmall.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  subheadLarge: {
    fontFamily: fontFamily.sansSerif[fonts.subheadLarge.family],
    fontSize: fonts.subheadLarge.fontSize,
    lineHeight: fonts.subheadLarge.lineHeight,
    fontWeight: fonts.subheadLarge.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  subheadSmall: {
    fontFamily: fontFamily.sansSerif[fonts.subheadSmall.family],
    fontSize: fonts.subheadSmall.fontSize,
    lineHeight: fonts.subheadSmall.lineHeight,
    fontWeight: fonts.subheadSmall.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodyLarge: {
    fontFamily: fontFamily.sansSerif[fonts.bodyLarge.family],
    fontSize: fonts.bodyLarge.fontSize,
    lineHeight: fonts.bodyLarge.lineHeight,
    fontWeight: fonts.bodyLarge.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodySmall: {
    fontFamily: fontFamily.sansSerif[fonts.bodySmall.family],
    fontSize: fonts.bodySmall.fontSize,
    lineHeight: fonts.bodySmall.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  bodyMicro: {
    fontFamily: fontFamily.sansSerif[fonts.bodyMicro.family],
    fontSize: fonts.bodyMicro.fontSize,
    lineHeight: fonts.bodyMicro.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.4,
  },
  buttonLabelLarge: {
    fontFamily: fontFamily.sansSerif[fonts.buttonLabelLarge.family],
    fontSize: fonts.buttonLabelLarge.fontSize,
    lineHeight: fonts.buttonLabelLarge.lineHeight,
    fontWeight: fonts.buttonLabelLarge.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMedium: {
    fontFamily: fontFamily.sansSerif[fonts.buttonLabelMedium.family],
    fontSize: fonts.buttonLabelMedium.fontSize,
    lineHeight: fonts.buttonLabelMedium.lineHeight,
    fontWeight: fonts.buttonLabelMedium.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelSmall: {
    fontFamily: fontFamily.sansSerif[fonts.buttonLabelSmall.family],
    fontSize: fonts.buttonLabelSmall.fontSize,
    lineHeight: fonts.buttonLabelSmall.lineHeight,
    fontWeight: fonts.buttonLabelSmall.fontWeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMicro: {
    fontFamily: fontFamily.sansSerif[fonts.buttonLabelMicro.family],
    fontSize: fonts.buttonLabelMicro.fontSize,
    lineHeight: fonts.buttonLabelMicro.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
  monospace: {
    fontFamily: fontFamily.sansSerif[fonts.monospace.family],
    fontSize: fonts.monospace.fontSize,
    lineHeight: fonts.monospace.lineHeight,
    color: 'neutral1',
    maxFontSizeMultiplier: 1.2,
  },
}
