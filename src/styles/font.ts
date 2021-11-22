// TODO set actual fonts
export const fontFamily = {
  serif: 'serif',
  sansSerif: {
    regular: 'UniswapSansBeta3-Regular',
    medium: 'UniswapSansBeta3-Medium',
    semibold: 'UniswapSansBeta3-Semibold',
    bold: 'UniswapSansBeta3-Bold',
  },
}

export const textVariants = {
  h1: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 34,
    lineHeight: 42.5,
    color: 'mainForeground',
  },
  h2: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 28,
    lineHeight: 36,
    color: 'mainForeground',
  },
  h3: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 20,
    lineHeight: 26,
    color: 'mainForeground',
  },
  body: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 16,
    lineHeight: 24,
    color: 'mainForeground',
  },
  bodySm: {
    fontFamily: fontFamily.sansSerif.regular,
    fontSize: 12,
    lineHeight: 20,
    color: 'mainForeground',
  },
  buttonLabel: {
    fontFamily: fontFamily.sansSerif.semibold,
    fontSize: 14,
    lineHeight: 24,
    color: 'mainForeground',
  },
  homeBalanceLabel: {
    fontFamily: fontFamily.sansSerif.medium,
    fontSize: 45,
    lineHeight: 45,
    color: 'mainForeground',
  },
}
