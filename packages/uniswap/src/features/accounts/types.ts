export enum AccountType {
  SignerMnemonic = 'signerMnemonic', // Key lives in native keystore
  Readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export interface SignerMnemonicAccountMeta {
  type: AccountType.SignerMnemonic
  address: Address
  chainId?: number
}

export interface ReadOnlyAccountMeta {
  type: AccountType.Readonly
  address: Address
}

export type AccountMeta = SignerMnemonicAccountMeta | ReadOnlyAccountMeta
