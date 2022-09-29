import { createTheme } from '@shopify/restyle'
import { iconButtonVariants, primaryButtonVariants } from 'src/styles/button'
import { colorsDark, colorsLight } from 'src/styles/color'
import { textVariants } from 'src/styles/font'
import { borderRadii, iconSizes, imageSizes, spacing } from 'src/styles/sizing'
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
    translucentBackground: opacify(50, colorsLight.backgroundBackdrop),
    imageTintBackground: opacify(80, colorsLight.backgroundSurface),
    ...colorsLight,
  },
  iconButtonVariants,
  primaryButtonVariants,
  iconSizes,
  imageSizes,
  spacing,
  textVariants,
  zIndices,
})

export const darkTheme: Theme = {
  ...theme,
  colors: {
    translucentBackground: opacify(5, colorsDark.white),
    imageTintBackground: opacify(80, colorsDark.backgroundSurface),
    ...colorsDark,
  },
}

export type Theme = typeof theme
