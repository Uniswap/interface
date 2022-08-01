import { Palette } from 'src/styles/color'

export enum AccountType {
  Native = 'native', // Key lives in native keystore
  WalletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
}

type DynamicPalette = Pick<Palette, 'userThemeColor'>

export type AccountCustomizations = {
  palette?: DynamicPalette
  localPfp?: string
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
  customizations?: AccountCustomizations
  backups?: BackupType[]
  flashbotsEnabled?: boolean
  pending?: boolean
  timeImportedMs: number
  pushNotificationsEnabled?: boolean
}

export interface NativeAccount extends AccountBase {
  type: AccountType.Native
  derivationIndex: number
  mnemonicId: string
}

export interface WalletConnectAccount extends AccountBase {
  type: AccountType.WalletConnect
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.Readonly
}

export type Account = NativeAccount | ReadOnlyAccount | WalletConnectAccount
