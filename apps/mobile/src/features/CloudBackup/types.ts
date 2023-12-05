export enum CloudStorageBackupsManagerEventType {
  FoundCloudBackup = 'FoundCloudBackup',
}

export interface CloudStorageMnemonicBackup {
  mnemonicId: string
  createdAt: number
  googleDriveEmail?: string
}
