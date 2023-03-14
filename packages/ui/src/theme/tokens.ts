import { createTokens } from '@tamagui/core'
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
}

const size = space

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
}

// Standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
const zIndex = {
  background: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
}

export const tokens = createTokens({
  color,
  space,
  size,
  zIndex,
  radius,
})
