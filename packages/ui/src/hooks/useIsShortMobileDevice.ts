import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { isWeb } from 'tamagui'
import { DEFAULT_BOTTOM_INSET, useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'

const IPHONE_MINI_SAFE_AREA_HEIGHT = 812 - DEFAULT_BOTTOM_INSET

// Returns true if the device is smaller or equal than an iPhone SE 2nd/3rd Gen or iPhone 12/13 Mini.
export const useIsShortMobileDevice = (): boolean => {
  const { height } = useSafeAreaFrame()
  const insets = useDeviceInsets()
  return !isWeb && height - insets.bottom <= IPHONE_MINI_SAFE_AREA_HEIGHT
}
