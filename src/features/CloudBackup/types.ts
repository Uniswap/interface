export enum ICloudBackupsManagerEventType {
  FoundCloudBackup = 'FoundCloudBackup',
}

export interface ICloudBackupsManagerError {
  message: string
}

export interface ICloudMnemonicBackup {
  mnemonicId: string
  createdAt: number
}
