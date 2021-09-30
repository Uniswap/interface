import { createTheme } from '@shopify/restyle'
import { colorsDark, colorsLight } from 'src/styles/color'
import { textVariants } from 'src/styles/font'
import { borderRadii, spacing } from 'src/styles/sizing'

export const theme = createTheme({
  colors: {
    mainBackground: colorsLight.white,
    mainForeground: colorsLight.black,
    ...colorsLight,
  },
  textVariants,
  spacing,
  breakpoints: {
    phone: 0,
    longPhone: {
      width: 0,
      height: 812,
    },
    tablet: 768,
    largeTablet: 1024,
  },
  borderRadii,
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
