import { ColorTokens } from 'tamagui'
import { colors, opacify } from 'ui/src/theme/color'

// TODO(EXT-142): standardize shadows better
export const mediumShadowProps = {
  shadowColor: '$sporeBlack',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
} as const

export const largeShadowProps = {
  shadowColor: opacify(7, colors.black) as ColorTokens,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 24,
} as const
