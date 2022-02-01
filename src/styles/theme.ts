import { createTheme } from '@shopify/restyle'
import { iconButtonVariants, primaryButtonVariants } from 'src/styles/button'
import { colorsDark, colorsLight } from 'src/styles/color'
import { textVariants } from 'src/styles/font'
import { borderRadii, spacing } from 'src/styles/sizing'
import { zIndices } from 'src/styles/zIndices'

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
    tokenSelector: colorsLight.paleBlue,
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
    mainBackground: colorsDark.black,
    mainForeground: colorsDark.white,
    tokenSelector: colorsLight.black,
    ...colorsDark,
  },
}

export type Theme = typeof theme
