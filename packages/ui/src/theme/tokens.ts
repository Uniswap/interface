import { createTokens } from 'tamagui'
import { borderRadii } from 'ui/src/theme/borderRadii'
import { colors as color } from 'ui/src/theme/color'
import { fonts } from 'ui/src/theme/fonts'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { imageSizes } from 'ui/src/theme/imageSizes'
import { spacing } from 'ui/src/theme/spacing'
import { zIndices } from 'ui/src/theme/zIndices'

const space = { ...spacing, true: 8 }

const size = space

const iconSize = { ...iconSizes, true: 40 }

const imageSize = { ...imageSizes, true: 40 }

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
  true: 14,
}

// remove true (default) when migrating from restyle to tamagui
const radius = { ...borderRadii, true: 0 }

const zIndex = { ...zIndices, true: 1 }

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
