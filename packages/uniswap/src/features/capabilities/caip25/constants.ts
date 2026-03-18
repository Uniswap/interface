export const SOLANA_NAMESPACE_IDENTIFIER = 'solana'

// EIP-155 defined the convention for EVM chain ids
export const EVM_NAMESPACE_IDENTIFIER = 'eip155'

export const DEFAULT_EVM_METHODS = [
  'eth_sendTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'personal_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
]
