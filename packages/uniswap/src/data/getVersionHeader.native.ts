// eslint-disable-next-line no-restricted-imports
import DeviceInfo from 'react-native-device-info'

export const getVersionHeader = (): string => {
  return DeviceInfo.getVersion()
}
