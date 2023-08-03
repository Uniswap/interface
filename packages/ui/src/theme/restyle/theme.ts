// TODO: rename to /theme/index.ts and move all other theme files to ui package
import { createTheme } from '@shopify/restyle'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colorsDark, colorsLight } from 'ui/src/theme/color'
import { opacify } from 'ui/src/theme/color/utils'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { imageSizes } from 'ui/src/theme/imageSizes'
import { textVariants } from 'ui/src/theme/restyle/font'
import { spacing } from 'ui/src/theme/spacing'
import { zIndices } from 'ui/src/theme/zIndices'

// TODO: move all of these tokens to shared theme files
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
    clearBackground1Backdrop: opacify(0, colorsLight.DEP_background1),
    translucentBackgroundBackdrop: opacify(50, colorsLight.DEP_background0),
    translucentBackground: opacify(50, colorsLight.DEP_background0),
    imageTintBackground: opacify(80, colorsLight.DEP_background1),
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
    clearBackground1Backdrop: opacify(0, colorsDark.DEP_background1),
    translucentBackgroundBackdrop: opacify(5, colorsDark.DEP_background0),
    // This color is incorrect for dark mode but we rely on the incorrect color right now.
    // The translucentBackgroundBackdrop is the correct translucent background in dark mode.
    // TODO: [MOB-252] come up with a better name for translucentBackground and add it to the theme.
    translucentBackground: opacify(5, colorsDark.DEP_white),
    imageTintBackground: opacify(80, colorsDark.DEP_background1),
    ...colorsDark,
  },
}

export type Theme = typeof theme
