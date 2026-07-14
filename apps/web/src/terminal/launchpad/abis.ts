/**
 * HookSwap Terminal — Launchpad (InstantPoolLauncherV2) ABIs.
 *
 * ABI mirrors the deployed InstantPoolLauncherV2 (0xCCaA…A3Bd) — reconcile if the
 * contract changes. Hand-written, minimal, matching the EXACT signatures verified on
 * Robinhood Chain. Consumed by `useLaunch` / `useMyLaunches` via wagmi's
 * `useReadContract` / `useReadContracts` / `useWriteContract` (all viem-typed).
 *
 * FACTS-ONLY: every entry mirrors a real function on the contract:
 *   • `launch(cfg) payable returns (address tokenAddr, address pool, uint256 tokenId)` —
 *     the primary factory call. `cfg` is a 16-field tuple (name … teamRecipient); `msg.value`
 *     must equal `launchFeeWei() + cfg.developerBuyWei`. No return value is available from a
 *     mined receipt (no event in the verified interface), so the new launch is read back via
 *     `launchCount()` → `getLaunch(count-1)` after confirmation — never fabricated.
 *   • Views: `launchFeeWei` / `launchCount` / `getLaunch` / `tokenToLaunchId` / `positions` /
 *     `hasPosition` / `pendingEth` / `DEFAULT_CREATOR_SHARE_BPS` / `MAX_CREATOR_SHARE_BPS`.
 *   • Fee collection: `collect(token)` / `collectForToken(token)` / `withdrawPending()`.
 *
 * The per-launch `OV3Genesis` ABI (`ov3GenesisAbi`) is included for later per-launch status
 * reads (`tradingOpen` / `pool` / `token` / `tokenId`) + `openTrading` / `collectFees`; the
 * primary Launchpad UI drives the factory `launch`.
 */

/* --------------------------------------------------------- InstantPoolLauncherV2 */

export const instantPoolLauncherV2Abi = [
  {
    type: 'function',
    name: 'launch',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'cfg',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'metadataUri', type: 'string' },
          { name: 'tokenSupply', type: 'uint256' },
          { name: 'salt', type: 'bytes32' },
          { name: 'sqrtPriceX96', type: 'uint160' },
          { name: 'tickLower', type: 'int24' },
          { name: 'tickUpper', type: 'int24' },
          { name: 'creatorShareBps', type: 'uint16' },
          { name: 'developerBuyWei', type: 'uint256' },
          { name: 'developerBuyMinOut', type: 'uint256' },
          { name: 'developerBuyDeadline', type: 'uint256' },
          { name: 'feeRecipient', type: 'address' },
          { name: 'dex', type: 'uint8' },
          { name: 'teamBps', type: 'uint16' },
          { name: 'teamRecipient', type: 'address' },
        ],
      },
    ],
    outputs: [
      { name: 'tokenAddr', type: 'address' },
      { name: 'pool', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'launchFeeWei',
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
      { name: 'token', type: 'address' },
      { name: 'pool', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'metadataUri', type: 'string' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'tokenToLaunchId',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'positions',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'feeRecipient', type: 'address' },
      { name: 'creatorShareBps', type: 'uint16' },
      { name: 'dex', type: 'uint8' },
    ],
  },
  {
    type: 'function',
    name: 'hasPosition',
    stateMutability: 'view',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'pendingEth',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'collect',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'collectForToken',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdrawPending',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'DEFAULT_CREATOR_SHARE_BPS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint16' }],
  },
  {
    type: 'function',
    name: 'MAX_CREATOR_SHARE_BPS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint16' }],
  },
] as const

/* ------------------------------------------------------- OV3Genesis (per-launch) */

export const ov3GenesisAbi = [
  {
    type: 'function',
    name: 'openTrading',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'collectFees',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pool',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'token',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tradingOpen',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
] as const
