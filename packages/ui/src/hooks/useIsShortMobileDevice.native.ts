import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { DEFAULT_BOTTOM_INSET, MobileDeviceHeight } from 'ui/src/hooks/constants'
// biome-ignore lint/style/noRestrictedImports: Use `useAppInsets` instead
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'

/**
 * @param deviceHeight - The type of device to check the height against. Defaults to MobileDeviceHeight.iPhone12 (812 height). @default MobileDeviceHeight.iPhone12
 * @returns true if run on the mobile app and the device height is smaller or equal to the height of the given device type minus the bottom inset.
 */
export const useIsShortMobileDevice = (deviceHeight: MobileDeviceHeight = MobileDeviceHeight.iPhone12): boolean => {
  const { height } = useSafeAreaFrame()
  const insets = useDeviceInsets()

  const heightWithoutBottomInsets = deviceHeight - DEFAULT_BOTTOM_INSET

  return height - insets.bottom <= heightWithoutBottomInsets
}
