import { NativeModules } from 'react-native'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

interface RNCloudStorageBackupsManager {
  isCloudStorageAvailable: () => Promise<boolean>
  deleteCloudStorageMnemonicBackup: (mnemonicId: string) => Promise<boolean>
  getCloudBackupList: () => Promise<CloudStorageMnemonicBackup[]>
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

export function getCloudBackupList(): Promise<CloudStorageMnemonicBackup[]> {
  return RNCloudStorageBackupsManager.getCloudBackupList()
}

export function backupMnemonicToCloudStorage(mnemonicId: string, password: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.backupMnemonicToCloudStorage(mnemonicId, password)
}

export function restoreMnemonicFromCloudStorage(mnemonicId: string, password: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.restoreMnemonicFromCloudStorage(mnemonicId, password)
}
