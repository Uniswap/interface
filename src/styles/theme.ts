import { createTheme } from '@shopify/restyle'
import { primaryButtonVariants } from 'src/styles/button'
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
    ...colorsLight,
  },
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
    ...colorsDark,
  },
}

export type Theme = typeof theme
