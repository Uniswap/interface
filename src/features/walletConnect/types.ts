// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSignTransaction = 'eth_sign_transaction',
  SignTypedData = 'eth_signTypedData',
  PersonalSign = 'personal_sign',
}

export type EthSignMethod = EthMethod.PersonalSign | EthMethod.SignTypedData | EthMethod.EthSign

interface BaseSessionEvent {
  session_id: string
  account: string
  dapp: DappInfo
}

export interface SessionConnectedEvent extends BaseSessionEvent {
  session_name: string
}

export interface SessionUpdatedEvent extends BaseSessionEvent {
  session_name: string
}

export interface SessionDisconnectedEvent extends BaseSessionEvent {}

export interface DappInfo {
  name: string
  url: string
  icon: string
  chain_id: string
}

export interface SignRequestEvent {
  account: string
  type: EthMethod
  message: string
  request_internal_id: string
  dapp: DappInfo
}

export interface WCError {
  type: string
  message?: string
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  SessionUpdated = 'session_updated',
  SessionDisconnected = 'session_disconnected',
  Error = 'error',
  SignRequest = 'sign_request',
}
