import { ReadOnlyAccountMeta, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
  Passkey = 'passkey',
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
  smartWalletConsent?: boolean
}

export interface ReadOnlyAccount extends WalletAccountFields, ReadOnlyAccountMeta {}

export type Account = SignerMnemonicAccount | ReadOnlyAccount
