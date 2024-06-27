export enum ImportAccountType {
  Address = 'address',
  Mnemonic = 'mnemonic',
  MnemonicNative = 'mnemonicNative',
  RestoreBackup = 'restoreBackup',
  Indexed = 'indexed',
}

interface BaseImportAccountParams {
  type: ImportAccountType
  name?: string
  locale?: string
  ignoreActivate?: boolean
}

export interface ImportAddressAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.Address
  address: Address
}

export interface ImportMnemonicAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.Mnemonic
  validatedMnemonic: string
  validatedPassword?: string
  indexes?: number[]
  markAsActive?: boolean // used for automatically activating test account
}

export interface ImportMnemonicIdAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.MnemonicNative
  mnemonicId: string
  indexes?: number[]
  markAsActive?: boolean // used for automatically activating test account
}

export interface ImportRestoreBackupAccountParams extends BaseImportAccountParams {
  type: ImportAccountType.RestoreBackup
  mnemonicId: string
  indexes?: number[]
}

export type ImportAccountParams =
  | ImportAddressAccountParams
  | ImportMnemonicAccountParams
  | ImportMnemonicIdAccountParams
  | ImportRestoreBackupAccountParams
