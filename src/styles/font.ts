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
  },
}

export const textVariants = {
  h1: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 36,
    lineHeight: 40,
    color: 'neutralTextPrimary',
  },
  h2: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 24,
    lineHeight: 32,
    color: 'neutralTextPrimary',
  },
  h3: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 20,
    lineHeight: 24,
    color: 'neutralTextPrimary',
  },
  subHead1: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 16,
    lineHeight: 24,
    color: 'neutralTextPrimary',
  },
  subHead2: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 14,
    lineHeight: 20,
    color: 'neutralTextPrimary',
  },
  body1: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'neutralTextPrimary',
  },
  body2: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'neutralTextPrimary',
  },
  caption: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'neutralTextPrimary',
  },
  badge: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 10,
    lineHeight: 12,
    color: 'neutralTextPrimary',
  },
  code: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'neutralTextPrimary',
  },
  largeLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 20,
    lineHeight: 24,
    color: 'neutralTextPrimary',
  },
  mediumLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: 'neutralTextPrimary',
  },
  smallLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 14,
    lineHeight: 16,
    color: 'neutralTextPrimary',
  },
}
