import { Dimensions } from 'react-native'

export const dimensions = {
  fullHeight: Dimensions.get('window').height,
  fullWidth: Dimensions.get('window').width,
}

export const spacing = {
  none: 0,
  xxs: 3,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 50,
}

export const borderRadii = {
  none: 0,
  xs: 3,
  sm: 6,
  md: 12,
  lg: 20,
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
