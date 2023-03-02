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

export enum WCRequestOutcome {
  Confirm = 'confirm',
  Reject = 'reject',
}

export type EthSignMethod =
  | EthMethod.PersonalSign
  | EthMethod.SignTypedData
  | EthMethod.EthSign
  | EthMethod.SignTypedDataV4
export type EthTransactionMethod = EthMethod.EthSignTransaction | EthMethod.EthSendTransaction

export interface DappInfoV1 {
  name: string
  url: string
  icon: string | null
  chain_id: number
  version: '1'
}

export interface DappInfoV2 {
  name: string
  url: string
  icon: string | null
  version: '2'
}

export type DappInfo = DappInfoV1 | DappInfoV2

export interface EthTransaction {
  to?: string
  from?: string
  value?: string
  data?: string
  gasLimit?: string
  gasPrice?: string
  nonce?: string
}

// The following events are only used by WalletConnectV1 request handlers
interface BaseRequestEvent {
  account: string
  dapp: DappInfoV1
  request_internal_id: string
  session_id: string
}

export interface TransactionRequestEvent extends BaseRequestEvent {
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
}

export interface SignRequestEvent extends BaseRequestEvent {
  type: EthMethod
  raw_message: string
  message: string | null
}

export interface SwitchChainRequestEvent extends BaseRequestEvent {
  type: EthMethod.SwitchChain | EthMethod.AddChain
  new_chain_id: number
}

interface BaseSessionEvent {
  session_id: string
  account: string
  dapp: DappInfoV1
}

export interface SessionConnectedEvent extends BaseSessionEvent {
  bridge_url: string
  is_new_connection: boolean
  client_id: string
}

export type SessionUpdatedEvent = BaseSessionEvent

export interface SessionDisconnectedEvent extends BaseSessionEvent {
  client_id: string
}

export type SessionPendingEvent = BaseSessionEvent

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

export function isPrimaryTypePermit(
  message: PermitMessage | Record<string, unknown>
): message is PermitMessage {
  return (message as PermitMessage).primaryType === 'Permit'
}
