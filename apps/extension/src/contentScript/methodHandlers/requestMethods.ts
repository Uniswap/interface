// Custom Uniswap methods that the extension will handle
/* eslint-disable @typescript-eslint/naming-convention */
export enum UniswapMethods {
  uniswap_openSidebar = 'uniswap_openSidebar',
}

// Methods that are not supported by the extension because they are deprecated
/* eslint-disable @typescript-eslint/naming-convention */
export enum DeprecatedEthMethods {
  eth_sign = 'eth_sign', // Security risk
  eth_signTypedData_v3 = 'eth_signTypedData_v3',
  eth_signTypedData_v1 = 'eth_signTypedData_v1',
  eth_decrypt = 'eth_decrypt',
  eth_getEncryptionPublicKey = 'eth_getEncryptionPublicKey',
}

// Methods that are handled by Metamask but not by the extension. These are logged
// so we can either display an error to the user or track frequency.
// Depending on the frequency with which we see these methods we could show an error
// in the sidebar for users.
// The methods come from: https://docs.metamask.io/wallet/reference/json-rpc-api/
/* eslint-disable @typescript-eslint/naming-convention */
export enum UnsupportedEthMethods {
  wallet_addEthereumChain = 'wallet_addEthereumChain',
  wallet_registerOnboarding = 'wallet_registerOnboarding',
  wallet_watchAsset = 'wallet_watchAsset',
  wallet_scanQRCode = 'wallet_scanQRCode',
  wallet_getSnaps = 'wallet_getSnaps',
  wallet_requestSnaps = 'wallet_requestSnaps',
  wallet_snap = 'wallet_snap',
  wallet_invokeSnap = 'wallet_invokeSnap',
  eth_subscribe = 'eth_subscribe',
  eth_unsubscribe = 'eth_unsubscribe',
  eth_blobBaseFee = 'eth_blobBaseFee',
  eth_coinbase = 'eth_coinbase',
  eth_feeHistory = 'eth_feeHistory',
  eth_getBlockByHash = 'eth_getBlockByHash',
  eth_getBlockTransactionCountByHash = 'eth_getBlockTransactionCountByHash',
  eth_getBlockTransactionCountByNumber = 'eth_getBlockTransactionCountByNumber',
  eth_getFilterChanges = 'eth_getFilterChanges',
  eth_getFilterLogs = 'eth_getFilterLogs',
  eth_getLogs = 'eth_getLogs',
  eth_getProof = 'eth_getProof',
  eth_getStorageAt = 'eth_getStorageAt',
  eth_getTransactionByBlockHashAndIndex = 'eth_getTransactionByBlockHashAndIndex',
  eth_getTransactionByBlockNumberAndIndex = 'eth_getTransactionByBlockNumberAndIndex',
  eth_getTransactionCount = 'eth_getTransactionCount',
  eth_getUncleCountByBlockHash = 'eth_getUncleCountByBlockHash',
  eth_getUncleCountByBlockNumber = 'eth_getUncleCountByBlockNumber',
  eth_maxPriorityFeePerGas = 'eth_maxPriorityFeePerGas',
  eth_newBlockFilter = 'eth_newBlockFilter',
  eth_newFilter = 'eth_newFilter',
  eth_newPendingTransactionFilter = 'eth_newPendingTransactionFilter',
  eth_sendRawTransaction = 'eth_sendRawTransaction',
  eth_syncing = 'eth_syncing',
  eth_uninstallFilter = 'eth_uninstallFilter',
  eth_signTransaction = 'eth_signTransaction',
}

export enum ProviderDirectMethods {
  eth_getBalance = 'eth_getBalance',
  eth_getCode = 'eth_getCode',
  eth_getStorageAt = 'eth_getStorageAt',
  eth_getTransactionCount = 'eth_getTransactionCount',
  eth_blockNumber = 'eth_blockNumber',
  eth_getBlockByNumber = 'eth_getBlockByNumber',
  eth_call = 'eth_call',
  eth_gasPrice = 'eth_gasPrice',
  eth_estimateGas = 'eth_estimateGas',
  eth_getTransactionByHash = 'eth_getTransactionByHash',
  eth_getTransactionReceipt = 'eth_getTransactionReceipt',
  net_version = 'net_version',
  web3_clientVersion = 'web3_clientVersion',
}
