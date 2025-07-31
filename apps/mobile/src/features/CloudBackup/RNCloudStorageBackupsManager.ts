import { NativeModules } from 'react-native'

interface RNCloudStorageBackupsManager {
  isCloudStorageAvailable: () => Promise<boolean>
  deleteCloudStorageMnemonicBackup: (mnemonicId: string) => Promise<boolean>
  startFetchingCloudStorageBackups: () => Promise<void>
  stopFetchingCloudStorageBackups: () => void
  backupMnemonicToCloudStorage: (mnemonicId: string, password: string) => Promise<boolean>
  restoreMnemonicFromCloudStorage: (mnemonicId: string, password: string) => Promise<boolean>
}

declare module 'react-native' {
  interface NativeModulesStatic {
    RNCloudStorageBackupsManager: RNCloudStorageBackupsManager
  }
}

const { RNCloudStorageBackupsManager } = NativeModules

export function isCloudStorageAvailable(): Promise<boolean> {
  return RNCloudStorageBackupsManager.isCloudStorageAvailable()
}

export function deleteCloudStorageMnemonicBackup(mnemonicId: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.deleteCloudStorageMnemonicBackup(mnemonicId)
}

export function startFetchingCloudStorageBackups(): Promise<void> {
  return RNCloudStorageBackupsManager.startFetchingCloudStorageBackups()
}

export function stopFetchingCloudStorageBackups(): void {
  return RNCloudStorageBackupsManager.stopFetchingCloudStorageBackups()
}

export function backupMnemonicToCloudStorage(mnemonicId: string, password: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.backupMnemonicToCloudStorage(mnemonicId, password)
}

export function restoreMnemonicFromCloudStorage(mnemonicId: string, password: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.restoreMnemonicFromCloudStorage(mnemonicId, password)
}
