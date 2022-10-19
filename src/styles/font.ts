// TODO set actual fonts
export const sizes = {
  0: 8,
  1: 12,
  2: 14,
  3: 16,
  4: 20,
  5: 24,
  6: 36,
}

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

export const textVariants = {
  headlineLarge: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 40,
    lineHeight: 48,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  headlineMedium: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 32,
    lineHeight: 38,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  headlineSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 24,
    lineHeight: 28,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  subheadLarge: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 20,
    lineHeight: 24,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.4,
  },
  subheadSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.4,
  },
  bodyLarge: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 16,
    lineHeight: 24,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.4,
  },
  bodySmall: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.4,
  },
  caption_deprecated: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  badge_deprecated: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 12,
    lineHeight: 12,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  code_deprecated: {
    fontFamily: fontFamily.sansSerif.monospace,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelLarge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMedium: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelSmall: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
  buttonLabelMicro: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: 'textPrimary',
    maxFontSizeMultiplier: 1.2,
  },
}
