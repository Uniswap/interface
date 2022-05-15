import { Palette } from 'src/styles/color'

export enum AccountType {
  Ledger = 'ledger',
  Local = 'local', // Key lives in JS, essentially just a normal ethers Wallet
  Native = 'native', // Key lives in native keystore
  WalletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
}

type DynamicPalette = Pick<
  Palette,
  | 'deprecated_primary1'
  | 'deprecated_secondary1'
  | 'deprecated_background1'
  | 'deprecated_textColor'
>

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
}

export interface LocalAccount extends AccountBase {
  type: AccountType.Local
  privateKey?: string
  mnemonic?: string
}

export interface NativeAccount extends AccountBase {
  type: AccountType.Native
}

export interface WalletConnectAccount extends AccountBase {
  type: AccountType.WalletConnect
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.Readonly
}

export interface LedgerAccount extends AccountBase {
  type: AccountType.Ledger
  deviceId: string
  path: string
}

export type Account =
  | LedgerAccount
  | LocalAccount
  | NativeAccount
  | ReadOnlyAccount
  | WalletConnectAccount
