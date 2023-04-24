import { NativeModules } from 'react-native'

const { RNICloudBackupsManager } = NativeModules

export function isICloudAvailable(): Promise<boolean> {
  return RNICloudBackupsManager.isICloudAvailable()
}

export function deleteICloudMnemonicBackup(mnemonicId: string): Promise<boolean> {
  return RNICloudBackupsManager.deleteICloudMnemonicBackup(mnemonicId)
}

export function startFetchingICloudBackups(): Promise<void> {
  return RNICloudBackupsManager.startFetchingICloudBackups()
}

export function stopFetchingICloudBackups(): Promise<void> {
  return RNICloudBackupsManager.stopFetchingICloudBackups()
}

export function backupMnemonicToICloud(mnemonicId: string, password: string): Promise<boolean> {
  return RNICloudBackupsManager.backupMnemonicToICloud(mnemonicId, password)
}

export function restoreMnemonicFromICloud(mnemonicId: string, password: string): Promise<boolean> {
  return RNICloudBackupsManager.restoreMnemonicFromICloud(mnemonicId, password)
}
