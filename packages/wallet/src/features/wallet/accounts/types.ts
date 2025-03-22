import { ReadOnlyAccountMeta, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
}

export type AccountCustomizations = {
  localPfp?: string
}

export interface WalletAccountFields {
  name?: string
  customizations?: AccountCustomizations
  backups?: BackupType[]
  timeImportedMs: number
  hasBalanceOrActivity?: boolean
  pushNotificationsEnabled: boolean
}

export interface SignerMnemonicAccount extends WalletAccountFields, SignerMnemonicAccountMeta {
  derivationIndex: number
  mnemonicId: string
}

export interface ReadOnlyAccount extends WalletAccountFields, ReadOnlyAccountMeta {}

export type Account = SignerMnemonicAccount | ReadOnlyAccount
