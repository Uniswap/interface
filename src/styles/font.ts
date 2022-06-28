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
    fontSize: 36,
    lineHeight: 44,
    color: 'textPrimary',
  },
  headlineMedium: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 28,
    lineHeight: 36,
    color: 'textPrimary',
  },
  headlineSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 20,
    lineHeight: 28,
    color: 'textPrimary',
  },
  subhead: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 16,
    lineHeight: 24,
    color: 'textPrimary',
  },
  subheadSmall: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
  },
  body: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'textPrimary',
  },
  bodySmall: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
  },
  caption: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'textPrimary',
  },
  badge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 10,
    lineHeight: 12,
    color: 'textPrimary',
  },
  code: {
    fontFamily: fontFamily.sansSerif.monospace,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
  },
  largeLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: 'textPrimary',
  },
  mediumLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: 'textPrimary',
  },
  smallLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 14,
    lineHeight: 16,
    color: 'textPrimary',
  },
}
