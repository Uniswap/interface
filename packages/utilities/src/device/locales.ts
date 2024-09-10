import { DeviceLocale } from 'utilities/src/device/constants'
import { NotImplementedError } from 'utilities/src/errors'

export function getDeviceLocales(): DeviceLocale[] {
  throw new NotImplementedError('getDeviceLocales')
}
