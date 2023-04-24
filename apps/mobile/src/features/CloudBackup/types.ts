export enum ICloudBackupsManagerEventType {
  FoundCloudBackup = 'FoundCloudBackup',
}

export interface ICloudMnemonicBackup {
  mnemonicId: string
  createdAt: number
}
