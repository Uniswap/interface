import DeviceInfo from 'react-native-device-info'

export const getVersionHeader = (): string => {
  return DeviceInfo.getVersion()
}
