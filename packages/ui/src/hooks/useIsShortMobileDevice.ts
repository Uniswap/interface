import { MobileDeviceHeight } from 'ui/src/hooks/constants'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * @param deviceHeight - The type of device to check the height against. Defaults to MobileDeviceHeight.iPhone12 (812 height). @default MobileDeviceHeight.iPhone12
 * @returns true if run on the mobile app and the device height is smaller or equal to the height of the given device type minus the bottom inset.
 */
export const useIsShortMobileDevice = (_deviceHeight: MobileDeviceHeight = MobileDeviceHeight.iPhone12): boolean => {
  throw new PlatformSplitStubError('useIsShortMobileDevice')
}
