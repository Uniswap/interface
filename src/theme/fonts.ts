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
    fontSize: 36,
    lineHeight: 44,
  },
  headlineMedium: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 28,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 20,
    lineHeight: 28,
  },
  subhead: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  subheadSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 10,
    lineHeight: 12,
  },
  code: {
    fontFamily: fontFamily.sansSerif.monospace,
    fontSize: 14,
    lineHeight: 20,
  },
  largeLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 20,
    lineHeight: 24,
  },
  mediumLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  smallLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 14,
    lineHeight: 16,
  },
}
