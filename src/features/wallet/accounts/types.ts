export enum AccountType {
  local = 'local', // Key lives in JS, essentially just a normal ethers Wallet
  native = 'native', // Key lives in native keystore
  walletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
}

export interface LocalAccount extends AccountBase {
  type: AccountType.local
  privateKey?: string
  mnemonic?: string
}

export interface NativeAccount extends AccountBase {
  type: AccountType.native
}

export interface WalletConnectAccount extends AccountBase {
  type: AccountType.walletConnect
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.readonly
}

export type Account = LocalAccount | NativeAccount | WalletConnectAccount | ReadOnlyAccount
