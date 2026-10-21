import { NativeModules } from 'react-native'
import { CloudBackupErrorCode, CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

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

const pendingBackups = new Map<string, { password: string; promise: Promise<boolean> }>()

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
  const pending = pendingBackups.get(mnemonicId)
  if (pending?.password === password) {
    return pending.promise
  }

  // A different password must be uploaded separately, after the previous attempt releases the native lock.
  // A failed attempt must not prevent the next one from running.
  const previousAttempt = pending ? pending.promise.catch(() => undefined) : Promise.resolve()
  const promise = previousAttempt
    .then(() => RNCloudStorageBackupsManager.backupMnemonicToCloudStorage(mnemonicId, password))
    .finally(() => {
      if (pendingBackups.get(mnemonicId)?.promise === promise) {
        pendingBackups.delete(mnemonicId)
      }
    })

  pendingBackups.set(mnemonicId, { password, promise })
  return promise
}

export function restoreMnemonicFromCloudStorage(mnemonicId: string, password: string): Promise<boolean> {
  return RNCloudStorageBackupsManager.restoreMnemonicFromCloudStorage(mnemonicId, password)
}

/**
 * Reads the rejection code off an error thrown by the native module, so callers can tell a full
 * cloud account apart from an upload that simply could not be confirmed.
 */
export function getCloudBackupErrorCode(error: unknown): CloudBackupErrorCode | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined
  }

  // Read it out before the callback: narrowing from the `in` check above does not survive into a closure.
  const { code } = error

  return Object.values(CloudBackupErrorCode).find((knownCode) => knownCode === code)
}
