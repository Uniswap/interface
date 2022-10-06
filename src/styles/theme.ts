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
    // The following two colors are the same to accomodate incorrect colors in dark mode. See comment in the dark mode section
    translucentBackgroundBackdrop: opacify(50, colorsLight.backgroundBackdrop),
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
    translucentBackgroundBackdrop: opacify(5, colorsDark.backgroundBackdrop),
    // This color is incorrect for dark mode but we rely on the incorrect color right now.
    // The translucentBackgroundBackdrop is the correct translucent background in dark mode.
    // TODO: come up with a better name for translucentBackground and add it to the theme.
    translucentBackground: opacify(5, colorsDark.white),
    imageTintBackground: opacify(80, colorsDark.backgroundSurface),
    ...colorsDark,
  },
}

export type Theme = typeof theme
