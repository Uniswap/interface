import { createTokens } from 'tamagui'
import { color } from './color'

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
  headlineLarge: 40,
  headlineMedium: 32,
  headlineSmall: 24,
  subheadLarge: 20,
  subheadSmall: 15,
  bodyLarge: 17,
  bodySmall: 15,
  bodyMicro: 12,
  buttonLabelLarge: 20,
  buttonLabelMedium: 17,
  buttonLabelSmall: 15,
  buttonLabelMicro: 12,
  monospace: 15,
  true: 'bodySmall',
}

const radius = {
  none: 0,
  rounded4: 4,
  rounded8: 8,
  rounded12: 12,
  rounded16: 16,
  rounded20: 20,
  rounded24: 24,
  rounded32: 32,
  roundedFull: 999999,
  true: 'none',
}

// Standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
const zIndex = space

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
