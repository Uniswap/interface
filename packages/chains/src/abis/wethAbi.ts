import type { Abi } from 'viem'

/**
 * Minimal WETH9 ABI, just the payable `deposit` (wrap) and
 * `withdraw` (unwrap) entry points the interface uses.
 */
export const wethAbi = [
  {
    constant: false,
    inputs: [],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ name: 'wad', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const satisfies Abi

export type WethAbi = typeof wethAbi
