import type { Abi } from 'viem'

/**
 * Minimal ENS registry ABI, just the `resolver(bytes32)` lookup
 * that tells us which resolver contract a node points to.
 */
export const ensRegistrarAbi = [
  {
    constant: true,
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: 'resolverAddress', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as const satisfies Abi

export type EnsRegistrarAbi = typeof ensRegistrarAbi
