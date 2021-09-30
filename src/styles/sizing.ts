import { Dimensions } from 'react-native'

export const dimensions = {
  fullHeight: Dimensions.get('window').height,
  fullWidth: Dimensions.get('window').width,
}

export const spacing = {
  xs: 5,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 50,
}

export const borderRadii = {
  none: 0,
  sm: 3,
  md: 6,
  lg: 10,
  full: 999999,
}
