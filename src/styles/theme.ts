import { createTheme } from '@shopify/restyle'
import { colorsDark, colorsLight } from 'src/styles/color'
import { textVariants } from 'src/styles/font'
import { borderRadii, iconSizes, imageSizes, spacing } from 'src/styles/sizing'
import { zIndices } from 'src/styles/zIndices'
import { opacify } from 'src/utils/colors'

export const theme = createTheme({
  borderRadii,
  // https://iosref.com/res#iphone
  breakpoints: {
    // iPhone SE (3rd generation) or iPhone 8
    xs: 0,
    // everything else
    sm: {
      width: 0,
      height: 736,
    },
  },
  colors: {
    // The following two colors are the same to accomodate incorrect colors in dark mode. See comment in the dark mode section
    clearBackgroundBackdrop: opacify(0, colorsLight.background0),
    translucentBackgroundBackdrop: opacify(50, colorsLight.background0),
    translucentBackground: opacify(50, colorsLight.background0),
    imageTintBackground: opacify(80, colorsLight.background1),
    ...colorsLight,
  },
  iconSizes,
  imageSizes,
  spacing,
  textVariants,
  zIndices,
})

export const darkTheme: Theme = {
  ...theme,
  colors: {
    clearBackgroundBackdrop: opacify(0, colorsDark.background0),
    translucentBackgroundBackdrop: opacify(5, colorsDark.background0),
    // This color is incorrect for dark mode but we rely on the incorrect color right now.
    // The translucentBackgroundBackdrop is the correct translucent background in dark mode.
    // TODO: [MOB-3923] come up with a better name for translucentBackground and add it to the theme.
    translucentBackground: opacify(5, colorsDark.white),
    imageTintBackground: opacify(80, colorsDark.background1),
    ...colorsDark,
  },
}

export type Theme = typeof theme
