import { AuthTypes } from '@walletconnect/types'

export enum WalletConnectEvent {
  Connected = 0,
  Disconnected = 1,
  NetworkChanged = 2,
  TransactionConfirmed = 3,
  TransactionFailed = 4,
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

export enum DappRequestType {
  WalletConnectSessionRequest = 'walletconnect-session-request',
  WalletConnectAuthenticationRequest = 'walletconnect-authentication-request',
}

// Standard WC session request
export interface WalletConnectSessionRequestInfo {
  requestType: DappRequestType.WalletConnectSessionRequest
  name: string
  url: string
  icon: string | null
}

/**
 * Authentication requests for WC 1-Click Auth type sessions.
 * See https://docs.reown.com/advanced/api/sign/wallet-usage#approving-authentication-requests
 */
export interface WalletConnectAuthenticationRequestInfo {
  requestType: DappRequestType.WalletConnectAuthenticationRequest
  name: string
  url: string
  icon: string | null
  authPayload: AuthTypes.AuthRequestEventArgs['authPayload']
}

export type DappRequestInfo = WalletConnectAuthenticationRequestInfo | WalletConnectSessionRequestInfo

export interface EthTransaction {
  to?: string
  from?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  maxPriorityFeePerGas?: string
  maxFeePerGas?: string
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

export function isPrimaryTypePermit(message: PermitMessage | Record<string, unknown>): message is PermitMessage {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  return (message as PermitMessage).primaryType === 'Permit'
}
