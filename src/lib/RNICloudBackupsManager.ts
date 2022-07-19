import { NativeModules } from 'react-native'

const { RNICloudBackupsManager } = NativeModules

export function isICloudAvailable(): Promise<boolean> {
  return RNICloudBackupsManager.isICloudAvailable()
}
