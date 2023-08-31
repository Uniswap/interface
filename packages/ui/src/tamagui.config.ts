import { createMedia } from '@tamagui/react-native-media-driver'
import { shorthands } from '@tamagui/shorthands'
import { createTamagui } from 'tamagui'
import { animations } from 'ui/src/theme/animations'
import { breakpoints } from 'ui/src/theme/breakpoints'
import { bodyFont, buttonFont, headingFont, subHeadingFont } from 'ui/src/theme/fonts'
import { themes } from 'ui/src/theme/themes'
import { tokens } from 'ui/src/theme/tokens'

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    subHeading: subHeadingFont,
    body: bodyFont,
    button: buttonFont,
  },
  themes,
  tokens,
  media: createMedia({
    xxs: { maxWidth: breakpoints.xxs },
    xs: { maxWidth: breakpoints.xs },
    sm: { maxWidth: breakpoints.sm },
    md: { maxWidth: breakpoints.md },
    lg: { maxWidth: breakpoints.lg },
    xl: { maxWidth: breakpoints.xl },
    xxl: { maxWidth: breakpoints.xxl },
    xxxl: { maxWidth: breakpoints.xxxl },

    // height based, equivalent to "sm" in restyle setup
    short: { maxHeight: 736 },
  }),
  settings: {
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
  },
})

export default config
