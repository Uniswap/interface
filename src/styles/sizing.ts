import { Dimensions } from 'react-native'

export const dimensions = {
  fullHeight: Dimensions.get('window').height,
  fullWidth: Dimensions.get('window').width,
}

export const spacing = {
  none: 0,
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
  xxxl: 60,
}

export const iconSizes = {
  xxs: 8,
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 36,
  xxxl: 42,
}

export const imageSizes = {
  xxs: 12,
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 36,
  xxl: 48,
}

export const borderRadii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999999,
}

// HitSlop allows users to slightly miss button
// To work, requires some padding in parent of button
export const defaultHitslop = 5
export const defaultHitslopInset = {
  top: defaultHitslop,
  bottom: defaultHitslop,
  left: defaultHitslop,
  right: defaultHitslop,
}
