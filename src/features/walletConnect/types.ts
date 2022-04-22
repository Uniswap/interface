// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSignTransaction = 'eth_sign_transaction',
  SignTypedData = 'eth_signTypedData',
  PersonalSign = 'personal_sign',
}

export type SessionConnectedEvent = {
  session_id: string
  session_name: string
  account: string
}

export type SessionDisconnectedEvent = {
  session_id: string
  account: string
}

export type DappInfo = {
  name: string
  url: string
  icon: string
}

export type SignRequestEvent = {
  account: string
  type: EthMethod
  message: string
  request_internal_id: string
  dapp: DappInfo
}

export type WCError = {
  type: string
  message?: string
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  SessionDisconnected = 'session_disconnected',
  Error = 'error',
  PersonalSign = 'personal_sign',
  SignTypedData = 'sign_typed_data',
}
