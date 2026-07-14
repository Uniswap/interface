/**
 * HookSwap Terminal — Locker contract ABIs.
 *
 * Minimal, hand-written ABIs matching the EXACT signatures of the contracts being
 * built at `contracts/locker/`. These are consumed by the Locker screen (B-Locker)
 * via wagmi's `useReadContract`/`useReadContracts`/`useWriteContract` (viem-typed).
 *
 * FACTS-ONLY: every entry below mirrors a real contract function from the locker
 * spec. If a signature changes at deploy time, update it here — the screen reads
 * these types, so a mismatch surfaces at compile time, not as fabricated data.
 *
 *   1. tokenLockerManagerAbi — HookSwapTokenLockerManager (ERC-20 + Uniswap-V2 LP)
 *   2. tokenLockerAbi        — child HookSwapTokenLocker (deposit / withdraw)
 *   3. v3PositionLockerAbi   — HookSwapV3PositionLocker (Uniswap v3 position NFTs)
 */

/* ------------------------------------------------------------------ 1. manager */

export const tokenLockerManagerAbi = [
  {
    type: 'function',
    name: 'lockFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'feeReceiver',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'createTokenLocker',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'unlockTime', type: 'uint40' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'tokenLockerCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint40' }],
  },
  {
    type: 'function',
    name: 'getTokenLockersForAddress',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint40[]' }],
  },
  {
    type: 'function',
    name: 'getTokenLockAddress',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint40' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'getTokenLockData',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint40' }],
    outputs: [
      { name: 'isLpToken', type: 'bool' },
      { name: 'id', type: 'uint40' },
      { name: 'contractAddress', type: 'address' },
      { name: 'lockOwner', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'createdBy', type: 'address' },
      { name: 'createdAt', type: 'uint40' },
      { name: 'unlockTime', type: 'uint40' },
      { name: 'balance', type: 'uint256' },
      { name: 'totalSupply', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getLpData',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint40' }],
    outputs: [
      { name: 'hasLpData', type: 'bool' },
      { name: 'id', type: 'uint40' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'balance0', type: 'uint256' },
      { name: 'balance1', type: 'uint256' },
      { name: 'price0', type: 'uint256' },
      { name: 'price1', type: 'uint256' },
    ],
  },
] as const

/* -------------------------------------------------------------- 2. child lock */

export const tokenLockerAbi = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'newUnlockTime', type: 'uint40' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const

/* ---------------------------------------------------------- 3. v3 position lock */

export const v3PositionLockerAbi = [
  {
    type: 'function',
    name: 'lockFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'lock',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftManager', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'unlockTime', type: 'uint40' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getLocksForAddress',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getLockData',
    stateMutability: 'view',
    inputs: [{ name: 'lockId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'nftManager', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'createdBy', type: 'address' },
      { name: 'createdAt', type: 'uint40' },
      { name: 'unlockTime', type: 'uint40' },
    ],
  },
  {
    type: 'function',
    name: 'collectFees',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'lockId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'extend',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'lockId', type: 'uint256' },
      { name: 'newUnlockTime', type: 'uint40' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'lockId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'transferLockOwnership',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'lockId', type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    outputs: [],
  },
] as const

/* ------------------------------------------------ 4. Uniswap-v3 NFT position manager */

/**
 * nftPositionManagerAbi — minimal read fragments of the canonical Uniswap-v3
 * NonfungiblePositionManager (ERC721Enumerable). Used to auto-enumerate the
 * connected wallet's owned v3 position NFTs for the locker's position selector:
 *   • tokenOfOwnerByIndex(owner, i) — the i-th owned tokenId (0..balanceOf-1).
 *   • positions(tokenId)            — token0/token1/fee for a readable label.
 * `balanceOf` / `approve` / `getApproved` / `isApprovedForAll` come from viem's
 * `erc721Abi` (already imported in the screen). Real on-chain reads only.
 */
export const nftPositionManagerAbi = [
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'positions',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' },
    ],
  },
] as const
