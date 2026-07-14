/**
 * HookSwap Terminal — Multisender (Disperse) ABIs.
 *
 * Minimal, hand-written ABI matching the EXACT signatures of the deployed `Disperse`
 * contract (`contracts/multisender/src/Disperse.sol`). Consumed by `useMultisend` via
 * wagmi's `useWriteContract` (viem-typed).
 *
 * FACTS-ONLY: both entries mirror a real function on the contract. The ERC-20 side reuses
 * viem's canonical `erc20Abi` (approve / allowance / decimals / symbol / balanceOf all
 * present) — re-exported here so this module is the single ABI source for the screen.
 */

export { erc20Abi } from '~/chains'

/* ------------------------------------------------------------------ Disperse */

export const disperseAbi = [
  {
    type: 'function',
    name: 'disperseToken',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'disperseEther',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const
