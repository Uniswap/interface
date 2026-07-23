import type { Abi } from 'viem'

/**
 * Minimal ENS public resolver ABI, just the `contenthash(bytes32)`
 * read. Returns the encoded content-addressed URI for a node.
 */
export const ensPublicResolverAbi = [
  {
    constant: true,
    inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    name: 'contenthash',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi

export type EnsPublicResolverAbi = typeof ensPublicResolverAbi
