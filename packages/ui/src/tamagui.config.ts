import { createMedia } from '@tamagui/react-native-media-driver'
import { shorthands as tamaguiShorthands } from '@tamagui/shorthands'
import { createTamagui } from 'tamagui'
import { breakpoints, heightBreakpoints } from 'ui/src/theme'
import { animations } from 'ui/src/theme/animations'
import { bodyFont, buttonFont, headingFont, subHeadingFont } from 'ui/src/theme/fonts'
import { themes } from 'ui/src/theme/themes'
import { tokens } from 'ui/src/theme/tokens'

const {
  // tamagui has this terribly awkward bc that is the same as bg :/, removing it for our purposes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bc,
  ...shorthands
} = tamaguiShorthands

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
    short: { maxHeight: heightBreakpoints.short },
  }),
  settings: {
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
})

export default config
