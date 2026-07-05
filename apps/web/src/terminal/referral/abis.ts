/**
 * HookSwap Terminal — Referral Router ABI.
 *
 * Minimal, hand-written viem ABI matching the EXACT signatures of the deployed
 * HookSwapReferralRouter (see `~/terminal/referral/addresses.ts` for per-chain
 * addresses). Consumed by the Referrals screen via wagmi's `useReadContract` /
 * `useWriteContract` (viem-typed) — a signature mismatch surfaces at compile
 * time, never as fabricated data.
 *
 * Functions (per handoff spec):
 *   • registerCode(bytes32 code, address claimWallet)                — write
 *   • codeOwner(bytes32 code) view returns (address)                 — read
 *   • claimable(bytes32 code, address token) view returns (uint256)  — read
 *   • claim(bytes32 code, address token)                             — write
 *   • defaultFeeBps() view returns (uint256)                         — read
 *   • swapExactInput(tokenIn, tokenOut, feeTier, amountIn,
 *       amountOutMin, recipient, refCode) payable                    — write
 */
export const referralRouterAbi = [
  {
    type: 'function',
    name: 'registerCode',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'code', type: 'bytes32' },
      { name: 'claimWallet', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'codeOwner',
    stateMutability: 'view',
    inputs: [{ name: 'code', type: 'bytes32' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'claimable',
    stateMutability: 'view',
    inputs: [
      { name: 'code', type: 'bytes32' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'code', type: 'bytes32' },
      { name: 'token', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'defaultFeeBps',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'swapExactInput',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'feeTier', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'refCode', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const
