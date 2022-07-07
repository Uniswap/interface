export const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const SWAP_TYPE = [
  { name: 'data', type: 'bytes' },
  { name: 'to', type: 'address' },
  { name: 'chainId', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'gasPrice', type: 'uint256' },
  { name: 'gasLimit', type: 'uint256' },
  { name: 'value', type: 'uint256' },
]
