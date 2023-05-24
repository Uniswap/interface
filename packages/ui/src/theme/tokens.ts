import { createTokens } from 'tamagui'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors as color } from 'ui/src/theme/color'
import { fonts } from 'ui/src/theme/fonts'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { imageSizes } from 'ui/src/theme/imageSizes'
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

const iconSize = { ...iconSizes, true: 'icon40' }

const imageSize = { ...imageSizes, true: 'image40' }

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
