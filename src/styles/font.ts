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
  h1: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 36,
    lineHeight: 40,
    color: 'textPrimary',
  },
  h2: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 24,
    lineHeight: 32,
    color: 'textPrimary',
  },
  h3: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 20,
    lineHeight: 24,
    color: 'textPrimary',
  },
  subHead1: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 16,
    lineHeight: 24,
    color: 'textPrimary',
  },
  subHead2: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 14,
    lineHeight: 20,
    color: 'textPrimary',
  },
  body1: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'textPrimary',
  },
  body2: {
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
