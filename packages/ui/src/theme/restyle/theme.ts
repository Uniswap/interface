// TODO: rename to /theme/index.ts and move all other theme files to ui package
import { createTheme } from '@shopify/restyle'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colorsDark, colorsLight } from 'ui/src/theme/color/colors'
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
  colors: colorsLight,
  iconSizes,
  imageSizes,
  spacing,
  textVariants,
  zIndices,
})

export const darkTheme: Theme = {
  ...theme,
  colors: colorsDark,
}

export type Theme = typeof theme
