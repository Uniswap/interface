import { ColorTokens } from 'tamagui'
import { colors, opacify } from 'ui/src/theme/color'

export const mediumShadowPropsLight = {
  shadowColor: opacify(16, colors.black) as ColorTokens,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 12,
} as const

export const mediumShadowPropsDark = {
  shadowColor: opacify(60, colors.black) as ColorTokens,
  shadowOffset: { width: 0, height: 6 },
  shadowRadius: 12,
} as const
