import { DeviceLocale } from 'utilities/src/device/constants'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function getDeviceLocales(): DeviceLocale[] {
  throw new PlatformSplitStubError('getDeviceLocales')
}
