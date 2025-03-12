import { Dimensions } from 'react-native'
import { DeviceDimensions } from 'ui/src/hooks/useDeviceDimensions/useDeviceDimensions'

export const useDeviceDimensions = (): DeviceDimensions => {
  // We need to use screen height instead of the window height
  // because window height doesn't include the status bar height
  // on Android
  // (https://stackoverflow.com/questions/44978804/whats-the-difference-between-window-and-screen-in-the-dimensions-api)
  const fullHeight = Dimensions.get('screen').height

  // We need to use window width instead of the screen width
  // because the screen width is not updated on foldable devices
  // when the screen is folded/unfolded
  // (https://stackoverflow.com/questions/65485878/react-native-samsung-one-ui-3-0-dimensions-screen-width-not-returning-correct-va)
  const fullWidth = Dimensions.get('window').width

  return { fullHeight, fullWidth }
}

export const useIsExtraLargeScreen = (): boolean => {
  return false
}
