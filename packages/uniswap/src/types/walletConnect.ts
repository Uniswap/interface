import { EthMethod } from 'uniswap/src/features/dappRequests/types'

export enum WalletConnectEvent {
  Connected = 0,
  Disconnected = 1,
  NetworkChanged = 2,
  TransactionConfirmed = 3,
  TransactionFailed = 4,
}

export enum UwULinkMethod {
  Erc20Send = 'erc20_send',
}

export enum EthEvent {
  AccountsChanged = 'accountsChanged',
  ChainChanged = 'chainChanged',
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  NetworkChanged = 'network_changed',
  SessionDisconnected = 'session_disconnected',
  SessionPending = 'session_pending',
  Error = 'error',
  SignRequest = 'sign_request',
  TransactionRequest = 'transaction_request',
}

export enum WCRequestOutcome {
  Confirm = 'confirm',
  Reject = 'reject',
}


interface UwULinkRequestDappInfo {
  name?: string
  url?: string
  icon?: string
}

interface UwULinkBaseRequest {
  method: | EthMethod.EthSendTransaction | EthMethod.PersonalSign | UwULinkMethod.Erc20Send
  chainId: number
  dapp?: UwULinkRequestDappInfo
  webhook?: string
}

interface UwULinkPersonalSignRequest extends UwULinkBaseRequest {
  method: EthMethod.PersonalSign
  message: string
  webhook: string
}

interface UwULinkGenericTransactionRequest extends UwULinkBaseRequest {
  method: EthMethod.EthSendTransaction
  value: EthTransaction
}

export interface UwULinkErc20SendRequest extends UwULinkBaseRequest {
  method: UwULinkMethod.Erc20Send
  type: UwULinkMethod.Erc20Send
  recipient: string
  tokenAddress: string
  amount: string

  // TODO: the wallet should determine stablecoin status
  isStablecoin: false
}

export type UwULinkRequest =
  | UwULinkGenericTransactionRequest
  | UwULinkErc20SendRequest
  | UwULinkPersonalSignRequest

export interface DappInfoWC {
  source: 'walletconnect'
  name: string
  url: string
  icon: string | null
}

export interface DappInfoUwULink {
  source: 'uwulink'
  name: string
  url: string
  icon?: string
  chain_id: number
  webhook?: string
}

export type DappInfo = DappInfoWC | DappInfoUwULink

export interface EthTransaction {
  to?: string
  from?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  nonce?: string
}

export interface PermitMessage {
  primaryType: 'Permit'
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  }
  message: {
    owner: string
    spender: string
    value: number
    nonce: number
    deadline: number
  }
}

export function isPrimaryTypePermit(
  message: PermitMessage | Record<string, unknown>
): message is PermitMessage {
  return (message as PermitMessage).primaryType === 'Permit'
}
