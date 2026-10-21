export interface CloudStorageMnemonicBackup {
  mnemonicId: string
  createdAt: number
  googleDriveEmail?: string
}

/**
 * Codes the native `RNCloudStorageBackupsManager` rejects a backup with. iOS only — Android reports
 * its own set, which falls through to the generic message.
 */
export enum CloudBackupErrorCode {
  /** The cloud account is out of storage, so the backup will never be uploaded. */
  QuotaExceeded = 'iCloudQuotaExceededError',
  /** The upload failed for another reason the provider considers final. */
  UploadFailed = 'backupUploadError',
  /** The upload is still in flight and may yet succeed, so nothing was cleaned up. */
  UploadNotConfirmed = 'backupUploadNotConfirmedError',
  /** Another backup for the same recovery phrase is already awaiting confirmation. */
  BackupInProgress = 'backupInProgressError',
}
