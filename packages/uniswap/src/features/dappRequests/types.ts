export enum DappRequestType {
  ChangeChain = 'ChangeChain',
  GetAccount = 'GetAccount',
  GetChainId = 'GetChainId',
  GetPermissions = 'GetPermissions',
  RequestAccount = 'RequestAccount',
  RequestPermissions = 'RequestPermissions',
  RevokePermissions = 'RevokePermissions',
  SendTransaction = 'SendTransaction',
  SignMessage = 'SignMessage',
  SignTransaction = 'SignTransaction',
  SignTypedData = 'SignTypedData',
  UniswapOpenSidebar = 'UniswapOpenSidebar',
  SendCalls = 'SendCalls',
  GetCallsStatus = 'GetCallsStatus',
}

export enum DappResponseType {
  AccountResponse = 'AccountResponse',
  ChainIdResponse = 'ChainIdResponse',
  ChainChangeResponse = 'ChainChangeResponse',
  ErrorResponse = 'ErrorResponse',
  GetPermissionsResponse = 'GetPermissions',
  RequestPermissionsResponse = 'RequestPermissions',
  RevokePermissionsResponse = 'RevokePermissions',
  SignTransactionResponse = 'SignTransactionResponse',
  SendTransactionResponse = 'SendTransactionResponse',
  SignTypedDataResponse = 'SignTypedDataResponse',
  SignMessageResponse = 'SignMessageResponse',
  UniswapOpenSidebarResponse = 'UniswapOpenSidebarResponse',
  SendCallsResponse = 'SendCallsResponse',
  GetCallsStatusResponse = 'GetCallsStatusResponse',
}

// derived from this list https://docs.walletconnect.com/json-rpc-api-methods/ethereum#eth_signtypeddata
export enum EthMethod {
  EthSign = 'eth_sign',
  EthSendTransaction = 'eth_sendTransaction',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  SwitchChain = 'wallet_switchEthereumChain',
  GetCapabilities = 'wallet_getCapabilities',
  SendCalls = 'wallet_sendCalls',
  GetCallsStatus = 'wallet_getCallsStatus',
  AddChain = 'wallet_addEthereumChain',
  PersonalSign = 'personal_sign',
}

export const SignatureMethods: string[] = [
  EthMethod.EthSign,
  EthMethod.SignTypedData,
  EthMethod.SignTypedDataV4,
  EthMethod.PersonalSign,
  DappRequestType.SignMessage,
  DappRequestType.SignTransaction,
  DappRequestType.SignTypedData,
] as const
