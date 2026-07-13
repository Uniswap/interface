import type { Abi } from 'viem'

/**
 * Typed ABI for feeOnTransferDetectorAbi. This is a copy of an ABI in the
 * `uniswap` package and is here to ease migrating to viem. Long-term
 * we should be de-duplicating by removing the JSON there.
 */
export const feeOnTransferDetectorAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_factoryV2',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'PairLookupFailed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SameToken',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'tokens',
        type: 'address[]',
      },
      {
        internalType: 'address',
        name: 'baseToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountToBorrow',
        type: 'uint256',
      },
    ],
    name: 'batchValidate',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'buyFeeBps',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'sellFeeBps',
            type: 'uint256',
          },
        ],
        internalType: 'struct TokenFees[]',
        name: 'fotResults',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'uniswapV2Call',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'baseToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountToBorrow',
        type: 'uint256',
      },
    ],
    name: 'validate',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'buyFeeBps',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'sellFeeBps',
            type: 'uint256',
          },
        ],
        internalType: 'struct TokenFees',
        name: 'fotResult',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const satisfies Abi

export type FeeOnTransferDetectorAbi = typeof feeOnTransferDetectorAbi
