import { SWAP_ROUTER_ADDRESSES } from './addresses'

export const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

export const SWAP_TYPE = [
  { name: 'txOwner', type: 'address' },
  { name: 'amountIn', type: 'string' },
  { name: 'amountOutMin', type: 'string' },
  { name: 'path', type: 'address[]' },
  { name: 'to', type: 'address' },
  { name: 'deadline', type: 'uint256' },
]

export const domain = (chainId: number) => {
  return {
    name: 'TEX swap',
    version: '1',
    chainId,
    verifyingContract: SWAP_ROUTER_ADDRESSES[chainId],
  }
}
