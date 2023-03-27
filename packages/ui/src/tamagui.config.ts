import { createMedia } from '@tamagui/react-native-media-driver'
import { createTamagui } from 'tamagui'

import { animations } from './theme/animations'
import { bodyFont, headingFont } from './theme/fonts'
import { themes } from './theme/themes'
import { tokens } from './theme/tokens'

export const config = createTamagui({
  // TODO: re-enable animations when type is fixed
  // https://discord.com/channels/909986013848412191/1074217558867198023/1076817576509837402
  animations,
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
