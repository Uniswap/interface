import { NativeModules } from 'react-native'

const { RNICloudBackupsManager } = NativeModules

export function isICloudAvailable(): Promise<boolean> {
  return RNICloudBackupsManager.isICloudAvailable()
}

export function startFetchingICloudBackups() {
  return RNICloudBackupsManager.startFetchingICloudBackups()
}

export function stopFetchingICloudBackups() {
  return RNICloudBackupsManager.stopFetchingICloudBackups()
}
