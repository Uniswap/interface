/**
 * HookSwap Terminal — v2 pool (create + seed liquidity) ABIs.
 *
 * Minimal, hand-written ABIs matching the EXACT signatures of the deployed own
 * UniswapV2Router02 / UniswapV2Factory (see `launchpad-integration/abis/*.json` and
 * `contracts/seed/SeedLiquidity.s.sol`). Consumed by `useCreateV2Pool` via wagmi's
 * `useReadContract` / `useReadContracts` / `useWriteContract` (viem-typed).
 *
 * v2 semantics (no Permit2): the caller approves each ERC-20 side to the Router02 via
 * a plain ERC-20 `allowance`, then calls `addLiquidity` (two ERC-20s) or
 * `addLiquidityETH` (one side native, `value` = the native amount). Both CREATE the
 * pair on the first add — no separate `createPair` needed for the first LP.
 *
 * FACTS-ONLY: every entry mirrors a real function on the deployed contracts. The
 * ERC-20 side reuses viem's canonical `erc20Abi` (approve / allowance / decimals /
 * symbol / balanceOf all present) — re-exported here so this module is the single
 * ABI source for the Pools screen.
 */

export { erc20Abi } from '~/chains'

/* ------------------------------------------------------------------ v2 Router02 */

export const poolRouter02Abi = [
  {
    type: 'function',
    name: 'factory',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'addLiquidity',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'addLiquidityETH',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amountTokenDesired', type: 'uint256' },
      { name: 'amountTokenMin', type: 'uint256' },
      { name: 'amountETHMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountToken', type: 'uint256' },
      { name: 'amountETH', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' },
    ],
  },
] as const

/* ------------------------------------------------------------------ v2 Factory */

export const poolFactoryAbi = [
  {
    type: 'function',
    name: 'getPair',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
  },
  {
    type: 'function',
    name: 'createPair',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
  },
] as const

/* ------------------------------------------------------------------ v2 Pair (reserves) */

export const poolPairAbi = [
  {
    type: 'function',
    name: 'getReserves',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const
