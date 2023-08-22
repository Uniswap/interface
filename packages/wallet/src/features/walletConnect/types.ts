export enum WalletConnectEvent {
  Connected,
  Disconnected,
  NetworkChanged,
  TransactionConfirmed,
  TransactionFailed,
}

// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSendTransaction = 'eth_sendTransaction',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  SwitchChain = 'wallet_switchEthereumChain',
  AddChain = 'wallet_addEthereumChain',
  PersonalSign = 'personal_sign',
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

export type EthSignMethod =
  | EthMethod.PersonalSign
  | EthMethod.SignTypedData
  | EthMethod.EthSign
  | EthMethod.SignTypedDataV4

export interface DappInfo {
  name: string
  url: string
  icon: string | null
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
