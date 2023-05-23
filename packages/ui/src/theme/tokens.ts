import { createTokens } from 'tamagui'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors as color } from 'ui/src/theme/color'
import { fonts } from 'ui/src/theme/fonts'
import { zIndices } from 'ui/src/theme/zIndices'

const space = {
  none: 0,
  spacing1: 1,
  spacing2: 2,
  spacing4: 4,
  spacing8: 8,
  spacing12: 12,
  spacing16: 16,
  spacing24: 24,
  spacing36: 36,
  spacing48: 48,
  spacing60: 60,
  true: 16,
}

const size = space

export const iconSize = {
  icon8: 8,
  icon12: 12,
  icon16: 16,
  icon20: 20,
  icon24: 24,
  icon28: 28,
  icon36: 36,
  icon40: 40,
  icon64: 64,
  true: 40,
}

const imageSize = {
  image12: 12,
  image16: 16,
  image20: 20,
  image24: 24,
  image32: 32,
  image36: 36,
  image40: 40,
  image48: 48,
  true: 40,
}

const fontSize = {
  headlineLarge: fonts.headlineLarge.fontSize,
  headlineMedium: fonts.headlineMedium.fontSize,
  headlineSmall: fonts.headlineSmall.fontSize,
  subheadLarge: fonts.subheadLarge.fontSize,
  subheadSmall: fonts.subheadSmall.fontSize,
  bodyLarge: fonts.bodyLarge.fontSize,
  bodySmall: fonts.bodySmall.fontSize,
  bodyMicro: fonts.bodyMicro.fontSize,
  buttonLabelLarge: fonts.buttonLabelLarge.fontSize,
  buttonLabelMedium: fonts.buttonLabelMedium.fontSize,
  buttonLabelSmall: fonts.buttonLabelSmall.fontSize,
  buttonLabelMicro: fonts.buttonLabelMicro.fontSize,
  monospace: fonts.monospace.fontSize,
  true: 'bodySmall',
}

// remove true (default) when migrating from restyle to tamagui
const radius = { ...borderRadii, true: 'none' }

const zIndex = { ...zIndices, true: 'default' }

export const tokens = createTokens({
  color,
  space,
  size,
  fontSize,
  iconSize,
  imageSize,
  zIndex,
  radius,
})
