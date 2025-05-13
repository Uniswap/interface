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
  GetCapabilities = 'GetCapabilities',
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
  GetCapabilitiesResponse = 'GetCapabilitiesResponse',
}

export enum EthMethod {
  EthSign = 'eth_sign',
  EthSendTransaction = 'eth_sendTransaction',
  SignTypedData = 'eth_signTypedData', // Note: WalletConnect supports this, Extension uses v4 only
  SignTypedDataV4 = 'eth_signTypedData_v4',
  WalletSwitchEthereumChain = 'wallet_switchEthereumChain',
  WalletGetCapabilities = 'wallet_getCapabilities',
  WalletSendCalls = 'wallet_sendCalls',
  WalletGetCallsStatus = 'wallet_getCallsStatus',
  WalletAddEthereumChain = 'wallet_addEthereumChain',
  PersonalSign = 'personal_sign',
  EthChainId = 'eth_chainId',
  EthRequestAccounts = 'eth_requestAccounts',
  EthAccounts = 'eth_accounts',
  WalletGetPermissions = 'wallet_getPermissions',
  WalletRequestPermissions = 'wallet_requestPermissions',
  WalletRevokePermissions = 'wallet_revokePermissions',
}

export type ExtensionEthMethod =
  | EthMethod.EthChainId
  | EthMethod.EthRequestAccounts
  | EthMethod.EthAccounts
  | EthMethod.EthSendTransaction
  | EthMethod.PersonalSign
  | EthMethod.WalletSwitchEthereumChain
  | EthMethod.WalletGetPermissions
  | EthMethod.WalletRequestPermissions
  | EthMethod.WalletRevokePermissions
  | EthMethod.WalletGetCapabilities
  | EthMethod.WalletSendCalls
  | EthMethod.WalletGetCallsStatus
  | EthMethod.SignTypedDataV4

export type WalletConnectEthMethod =
  | EthMethod.EthSign
  | EthMethod.EthSendTransaction
  | EthMethod.SignTypedData
  | EthMethod.SignTypedDataV4
  | EthMethod.WalletSwitchEthereumChain
  | EthMethod.WalletGetCapabilities
  | EthMethod.WalletSendCalls
  | EthMethod.WalletGetCallsStatus
  | EthMethod.WalletAddEthereumChain
  | EthMethod.PersonalSign

export type EthSignMethod =
  | EthMethod.PersonalSign
  | EthMethod.SignTypedData
  | EthMethod.SignTypedDataV4
  | EthMethod.EthSign
