import { Dimensions } from 'react-native'

export const dimensions = {
  fullHeight: Dimensions.get('screen').height,
  fullWidth: Dimensions.get('screen').width,
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
