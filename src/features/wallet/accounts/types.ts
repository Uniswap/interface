import { providers, Signer, VoidSigner, Wallet } from 'ethers'
import { SupportedChainId } from 'src/constants/chains'
import { NativeSigner } from 'src/features/wallet/accounts/NativeSigner'

export enum AccountType {
  local = 'local', // Key lives in JS, essentially just a normal ethers Wallet
  native = 'native', // Key lives in native keystore
  walletConnect = 'walletConnect', // Account connected over WalletConnect protocol
  readonly = 'readonly', // Accounts without keys (e.g. so user can track balances)
}

export interface AccountStub {
  type: AccountType
  address: Address
  name: string
  chainId: SupportedChainId
}

interface AccountBase {
  type: AccountType
  address: Address
  name: string
  chainId: SupportedChainId
  signer: Signer
  provider?: providers.JsonRpcProvider
}

export interface LocalAccount extends AccountBase {
  type: AccountType.local
  signer: Wallet
}

export interface NativeAccount extends AccountBase {
  type: AccountType.native
  signer: NativeSigner
}

export interface WalletConnectAccount extends AccountBase {
  type: AccountType.walletConnect
  signer: Signer // TODO use walletconnect's signer
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.readonly
  signer: VoidSigner
}

export type Account = LocalAccount | NativeAccount | WalletConnectAccount
