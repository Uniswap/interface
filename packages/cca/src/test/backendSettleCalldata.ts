import { encodeFunctionData } from 'viem'

/**
 * TEST FIXTURE — settle calldata as the BACKEND encodes it, transcribed from a different repo than
 * the guards under test so a drift between the two breaks a test rather than refusing every settle
 * in production. Same source as apps/pools-xyz's backendSettleAbi.ts (backend liquidity service,
 * lib/abi/Auction.json + lib/contracts/auction.ts encode sites). Parameter names keep the backend's
 * leading underscores as the marker that they were transcribed from there.
 */

const BACKEND_CLAIM_ONE_ABI = [
  {
    type: 'function',
    name: 'claimTokens',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_bidId', type: 'uint256' }],
    outputs: [],
  },
] as const

const BACKEND_CLAIM_BATCH_ABI = [
  {
    type: 'function',
    name: 'claimTokensBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_bidIds', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const

const BACKEND_EXIT_ONE_ABI = [
  {
    type: 'function',
    name: 'exitBid',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_bidId', type: 'uint256' }],
    outputs: [],
  },
] as const

const BACKEND_EXIT_PARTIAL_ABI = [
  {
    type: 'function',
    name: 'exitPartiallyFilledBid',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_bidId', type: 'uint256' },
      { name: '_lastFullyFilledCheckpointBlock', type: 'uint64' },
      { name: '_outbidBlock', type: 'uint64' },
    ],
    outputs: [],
  },
] as const

/** Multicall3.aggregate3, transcribed from the backend's inline ABI. */
const AGGREGATE3_FIXTURE_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'callData', type: 'bytes' },
        ],
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'aggregate3',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

/** LbpStrategies `migrate(ILBPInitializer)` — backend LbpStrategies.json. */
const MIGRATE_FIXTURE_ABI = [
  {
    type: 'function',
    name: 'migrate',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'initializer', type: 'address' }],
    outputs: [],
  },
] as const

/** The four selectors as literals, so both repos being edited to agree on something new still
 * fails a test. */
export const BACKEND_SETTLE_SELECTORS = {
  claimTokens: '0x46e04a2f',
  claimTokensBatch: '0xb8f163d6',
  exitBid: '0x8e4deb17',
  exitPartiallyFilledBid: '0x36dec5f2',
} as const

export const backendClaimOne = (bidId: bigint): string =>
  encodeFunctionData({ abi: BACKEND_CLAIM_ONE_ABI, functionName: 'claimTokens', args: [bidId] })

export const backendClaimBatch = (owner: `0x${string}`, bidIds: readonly bigint[]): string =>
  encodeFunctionData({ abi: BACKEND_CLAIM_BATCH_ABI, functionName: 'claimTokensBatch', args: [owner, bidIds] })

export const backendExitOne = (bidId: bigint): string =>
  encodeFunctionData({ abi: BACKEND_EXIT_ONE_ABI, functionName: 'exitBid', args: [bidId] })

export const backendExitPartial = (
  bidId: bigint,
  fill: { lastFullyFilledCheckpointBlock: bigint; outbidBlock: bigint },
): string =>
  encodeFunctionData({
    abi: BACKEND_EXIT_PARTIAL_ABI,
    functionName: 'exitPartiallyFilledBid',
    args: [bidId, fill.lastFullyFilledCheckpointBlock, fill.outbidBlock],
  })

export interface FixtureCall {
  target: string
  allowFailure: boolean
  callData: string
}

export function multicallData(calls: FixtureCall[]): string {
  return encodeFunctionData({
    abi: AGGREGATE3_FIXTURE_ABI,
    functionName: 'aggregate3',
    args: [
      calls.map((call) => ({
        ...call,
        target: call.target as `0x${string}`,
        callData: call.callData as `0x${string}`,
      })),
    ],
  })
}

export function migrateData(initializer: string): string {
  return encodeFunctionData({ abi: MIGRATE_FIXTURE_ABI, functionName: 'migrate', args: [initializer as `0x${string}`] })
}
