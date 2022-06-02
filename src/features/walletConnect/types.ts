// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSignTransaction = 'eth_signTransaction',
  EthSendTransaction = 'eth_sendTransaction',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  PersonalSign = 'personal_sign',
}

export enum WCErrorType {
  InvalidURL = 'wc_invalid_url',
  DisconnectError = 'wc_disconnect_error',
  ConnectError = 'wc_connect_error',
  RejectRequestError = 'wc_reject_request_error',
  SendSignatureError = 'wc_send_signature_error',
  SwitchChainError = 'wc_switch_chain_eror',
  UnsupportedChainError = 'wc_unsupported_chain_error',
  InvalidRequestId = 'invalid_request_id',
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  SessionUpdated = 'session_updated',
  SessionDisconnected = 'session_disconnected',
  Error = 'error',
  SignRequest = 'sign_request',
  TransactionRequest = 'transaction_request',
}

export type EthSignMethod =
  | EthMethod.PersonalSign
  | EthMethod.SignTypedData
  | EthMethod.EthSign
  | EthMethod.SignTypedDataV4
export type EthTransactionMethod = EthMethod.EthSignTransaction | EthMethod.EthSendTransaction

interface BaseSessionEvent {
  session_id: string
  account: string
  dapp: DappInfo
}

export interface SessionConnectedEvent extends BaseSessionEvent {
  session_name: string
  show_notification: boolean
}

export interface SessionUpdatedEvent extends BaseSessionEvent {
  session_name: string
}

export interface SessionDisconnectedEvent extends BaseSessionEvent {}

export interface DappInfo {
  name: string
  url: string
  icon: string
  chain_id: number
}

export interface EthTransaction {
  to: string
  from: string
  value: string
  data: string
  gas: string
  gasPrice: string
  nonce: string
}

export interface TransactionRequestEvent {
  account: string
  type: EthTransactionMethod
  transaction: {
    to: string
    from: string
    value: string
    data: string
    gas: string
    gas_price: string
    nonce: string
  }
  request_internal_id: string
  dapp: DappInfo
}

export interface SignRequestEvent {
  account: string
  type: EthMethod
  raw_message: string
  message: string | null
  request_internal_id: string
  dapp: DappInfo
}

export interface WCError {
  account: string
  type: WCErrorType
  message?: string
  dapp?: DappInfo
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

export function isPrimaryTypePermit(message: any): message is PermitMessage {
  return message.primaryType === 'Permit'
}
