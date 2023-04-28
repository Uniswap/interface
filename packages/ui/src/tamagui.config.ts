import { createMedia } from '@tamagui/react-native-media-driver'
import { createTamagui } from 'tamagui'
import { TamaguiInternalConfig } from 'ui/src'
// import { animations } from './theme/animations'
import { bodyFont, headingFont } from './theme/fonts'
import { themes } from './theme/themes'
import { tokens } from './theme/tokens'

export const config: TamaguiInternalConfig = createTamagui({
  // TODO: revisit when fixed in tamagui:
  // see https://github.com/tamagui/tamagui/blob/8f3fc537f2a20a85933e4536024fc4f5786b658d/packages/web/src/types.tsx#L553
  // animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  // shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
})
