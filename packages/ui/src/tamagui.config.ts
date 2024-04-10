import { createMedia } from '@tamagui/react-native-media-driver'
import { createTamagui } from 'tamagui'
import { breakpoints, heightBreakpoints } from 'ui/src/theme'
import { animations } from 'ui/src/theme/animations'
import { bodyFont, buttonFont, headingFont, subHeadingFont } from 'ui/src/theme/fonts'
import { themes } from 'ui/src/theme/themes'
import { tokens } from 'ui/src/theme/tokens'

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  onlyAllowShorthands: true,
  shorthands: {
    m: 'margin',
    mb: 'marginBottom',
    ml: 'marginLeft',
    mr: 'marginRight',
    mt: 'marginTop',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    p: 'padding',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    pr: 'paddingRight',
    pt: 'paddingTop',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
  } as const,
  fonts: {
    heading: headingFont,
    subHeading: subHeadingFont,
    body: bodyFont,
    button: buttonFont,
  },
  themes,
  tokens,
  media: createMedia({
    // the order here is important: least strong to most
    xxxl: { maxWidth: breakpoints.xxxl },
    xxl: { maxWidth: breakpoints.xxl },
    xl: { maxWidth: breakpoints.xl },
    lg: { maxWidth: breakpoints.lg },
    md: { maxWidth: breakpoints.md },
    sm: { maxWidth: breakpoints.sm },
    xs: { maxWidth: breakpoints.xs },
    xxs: { maxWidth: breakpoints.xxs },
    short: { maxHeight: heightBreakpoints.short },
  }),
  settings: {
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
})

export default config
