import { createTheme } from '@shopify/restyle'
import { iconButtonVariants, primaryButtonVariants } from 'src/styles/button'
import { colorsDark, colorsLight } from 'src/styles/color'
import { textVariants } from 'src/styles/font'
import { borderRadii, spacing } from 'src/styles/sizing'
import { zIndices } from 'src/styles/zIndices'
import { opacify } from 'src/utils/colors'

export const theme = createTheme({
  borderRadii,
  breakpoints: {
    phone: 0,
    longPhone: {
      width: 0,
      height: 812,
    },
    tablet: 768,
    largeTablet: 1024,
  },
  colors: {
    mainBackground: colorsLight.white,
    mainForeground: colorsLight.black,
    tabBackground: opacify(20, colorsLight.gray50),
    tokenSelector: colorsLight.gray50,
    shimmer: colorsLight.white,
    ...colorsLight,
  },
  iconButtonVariants,
  primaryButtonVariants,
  spacing,
  textVariants,
  zIndices,
})

export const darkTheme: Theme = {
  ...theme,
  colors: {
    mainBackground: colorsDark.background1,
    mainForeground: colorsDark.white,
    tabBackground: opacify(40, colorsDark.gray50),
    tokenSelector: colorsDark.gray50,
    shimmer: colorsDark.gray100,
    ...colorsDark,
  },
}

export type Theme = typeof theme
