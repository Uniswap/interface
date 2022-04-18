import { Palette } from 'src/styles/color'

export enum AccountType {
  Ledger = 'ledger',
  Local = 'local', // Key lives in JS, essentially just a normal ethers Wallet
  Native = 'native', // Key lives in native keystore
  WalletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

type DynamicPalette = Pick<Palette, 'primary1' | 'secondary1' | 'background1' | 'textColor'>

export type AccountCustomizations = {
  palette?: DynamicPalette
  localPfp?: string
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
  customizations?: AccountCustomizations
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
