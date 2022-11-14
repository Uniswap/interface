// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSignTransaction = 'eth_signTransaction',
  EthSendTransaction = 'eth_sendTransaction',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  SwitchChain = 'wallet_switchEthereumChain',
  AddChain = 'wallet_addEthereumChain',
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
  InvalidAccount = 'invalid_account',
  PendingSessionNotFound = 'pending_session_not_found',
}

export enum WCEventType {
  SessionConnected = 'session_connected',
  NetworkChanged = 'network_changed',
  SessionDisconnected = 'session_disconnected',
  SessionPending = 'session_pending',
  Error = 'error',
  SignRequest = 'sign_request',
  TransactionRequest = 'transaction_request',
  SwitchChainRequest = 'switch_chain_request',
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
  bridge_url: string
  is_new_connection: boolean
  client_id: string
}

export interface SessionUpdatedEvent extends BaseSessionEvent {}

export interface SessionDisconnectedEvent extends BaseSessionEvent {
  client_id: string
}

export interface SessionPendingEvent extends BaseSessionEvent {}

export interface DappInfo {
  name: string
  url: string
  icon: string | null
  chain_id: number
}

export interface EthTransaction {
  to?: string
  from?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  nonce?: string
}

export interface TransactionRequestEvent {
  account: string
  type: EthTransactionMethod
  transaction: {
    to: string | null
    from: string | null
    value: string | null
    data: string | null
    gas: string | null
    gas_price: string | null
    nonce: string | null
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

export interface SwitchChainRequestEvent {
  account: string
  type: EthMethod.SwitchChain | EthMethod.AddChain
  request_internal_id: string
  session_id: string
  new_chain_id: number
  dapp: DappInfo
}

export interface WCError {
  account: string | null
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

export enum DappSourceInfo { // for future use in WalletConnectModal when we have a list of trusted dapps
  Trusted,
  Unknown,
  Malicious,
}

export function isPrimaryTypePermit(message: any): message is PermitMessage {
  return message.primaryType === 'Permit'
}
