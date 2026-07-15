/**
 * HookSwap Terminal — Launchpad ABIs (HookOSV3Launcher + HookOSV3FeeVault).
 *
 * Minimal hand-written viem ABIs matching the deployed proxies on Robinhood (4663):
 *   Launcher: 0x9B8d992704ddf38729535A641502bcc55734e0B8
 *   FeeVault: 0x2974cE6341067398A5C1E6c0C14F99ED1C3122EF
 *
 * Only functions the UI actually calls are included — admin/role/upgrade methods omitted.
 */

/* --------------------------------------------------------- HookOSV3Launcher */

export const hookOSV3LauncherAbi = [
  {
    type: 'function',
    name: 'launch',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'p',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'metadataURI', type: 'string' },
          { name: 'totalSupply', type: 'uint256' },
          { name: 'salt', type: 'bytes32' },
          { name: 'sqrtPriceX96', type: 'uint160' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'initialBuyEth', type: 'uint256' },
          { name: 'initialBuyMinOut', type: 'uint256' },
          { name: 'initialBuyDeadline', type: 'uint256' },
          { name: 'dex', type: 'uint8' },
          { name: 'pair', type: 'uint8' },
          { name: 'lockOnHookSwap', type: 'bool' },
        ],
      },
    ],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'pool', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'quoteLaunchCost',
    stateMutability: 'view',
    inputs: [
      { name: 'lockOnHookSwap', type: 'bool' },
      { name: 'initialBuyEth', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'effectiveLaunchFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'launchFeeUsd',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'launchCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getLaunch',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'pool', type: 'address' },
          { name: 'creator', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'feeTier', type: 'uint24' },
          { name: 'dex', type: 'uint8' },
          { name: 'locker', type: 'address' },
          { name: 'pair', type: 'uint8' },
          { name: 'pairToken', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getLaunchByToken',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'pool', type: 'address' },
          { name: 'creator', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'feeTier', type: 'uint24' },
          { name: 'dex', type: 'uint8' },
          { name: 'locker', type: 'address' },
          { name: 'pair', type: 'uint8' },
          { name: 'pairToken', type: 'address' },
          { name: 'metadataURI', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'launchIdOf',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ name: 'launchId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'isHookOSV3Token',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'hookPairEnabled',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'hookPairStatus',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'ok', type: 'bool' },
      { name: 'depth', type: 'uint256' },
      { name: 'fresh', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'dexConfig',
    stateMutability: 'view',
    inputs: [{ type: 'uint8' }],
    outputs: [
      { name: 'factory', type: 'address' },
      { name: 'positionManager', type: 'address' },
      { name: 'swapRouter02', type: 'address' },
      { name: 'quoter', type: 'address' },
      { name: 'feeTier', type: 'uint24' },
      { name: 'tickSpacing', type: 'int24' },
    ],
  },
  {
    type: 'function',
    name: 'hookSwapLockFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'predictToken',
    stateMutability: 'view',
    inputs: [
      { name: 'salt', type: 'bytes32' },
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'supply_', type: 'uint256' },
      { name: 'creator_', type: 'address' },
      { name: 'metadataURI_', type: 'string' },
    ],
    outputs: [{ type: 'address' }],
  },
  // Events consumed by the UI
  {
    type: 'event',
    name: 'LaunchCreated',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
      { name: 'initialSupply', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PoolSeeded',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'pool', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'feeTier', type: 'uint24', indexed: false },
      { name: 'dex', type: 'uint8', indexed: false },
    ],
  },
] as const

/* --------------------------------------------------------- HookOSV3FeeVault */

export const hookOSV3FeeVaultAbi = [
  {
    type: 'function',
    name: 'pending',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'wethOwed', type: 'uint256' },
      { name: 'tokenOwed', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'pendingEth',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'collect',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'ethOut', type: 'uint256' },
      { name: 'tokenOut', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'withdrawPending',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'positions',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'locker', type: 'address' },
      { name: 'lockId', type: 'uint256' },
      { name: 'dex', type: 'uint8' },
      { name: 'pair', type: 'uint8' },
      { name: 'pairToken', type: 'address' },
      { name: 'registered', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'creatorShareBpsByDex',
    stateMutability: 'view',
    inputs: [{ type: 'uint8' }],
    outputs: [{ type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'isPermanentlyLocked',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'locked', type: 'bool' },
      { name: 'unlockTime', type: 'uint40' },
    ],
  },
] as const
