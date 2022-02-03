export enum AccountType {
  Local = 'local', // Key lives in JS, essentially just a normal ethers Wallet
  Native = 'native', // Key lives in native keystore
  WalletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
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

export type Account = LocalAccount | NativeAccount | WalletConnectAccount | ReadOnlyAccount
