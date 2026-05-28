import { XStackProps } from 'tamagui'

export const FOCUS_SCALE = 0.98
export const PRESS_SCALE = FOCUS_SCALE

export const defaultFocusVisibleStyle = {
  outlineColor: '$neutral3Hovered',
} satisfies XStackProps['focusVisibleStyle']

export const brandedFocusVisibleStyle = {
  outlineColor: '$accent1Hovered',
} satisfies XStackProps['focusVisibleStyle']

export const criticalFocusVisibleStyle = {
  outlineColor: '$statusCriticalHovered',
} satisfies XStackProps['focusVisibleStyle']

export const warningFocusVisibleStyle = {
  outlineColor: '$statusWarningHovered',
} satisfies XStackProps['focusVisibleStyle']

export const commonPressStyle = {
  scale: PRESS_SCALE,
} satisfies XStackProps['pressStyle']
