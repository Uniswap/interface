/**
 * HookSwap Terminal — Token Factory (HookSwapTokenFactory) ABI.
 *
 * Minimal, hand-written ABI matching the EXACT signatures of the deployed
 * `HookSwapTokenFactory` contract (`contracts/token-factory/src/HookSwapTokenFactory.sol`).
 * Consumed by `useCreateToken` via wagmi's `useReadContract` / `useWriteContract` and
 * viem's `parseEventLogs` (all viem-typed).
 *
 * FACTS-ONLY: every entry mirrors a real function / event on the contract:
 *   • `createToken(name, symbol, decimals, supply) payable returns (address)` — deploys a
 *     fresh fixed-supply ERC-20; the full supply is minted to msg.sender.
 *   • `TokenCreated(address indexed token, address indexed creator, string name, string symbol)`
 *     — emitted once per create; decoded from the receipt to surface the new token address.
 *   • `createFee() view returns (uint256)` — optional native fee (0 = free), passed as `value`.
 */

export const tokenFactoryAbi = [
  {
    type: 'function',
    name: 'createToken',
    stateMutability: 'payable',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'decimals_', type: 'uint8' },
      { name: 'supply_', type: 'uint256' },
    ],
    outputs: [{ name: 'token', type: 'address' }],
  },
  {
    type: 'function',
    name: 'createFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'TokenCreated',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'symbol', type: 'string', indexed: false },
    ],
    anonymous: false,
  },
] as const
