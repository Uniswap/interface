import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { vi } from 'vitest'
import { getSupplySchedulePoints } from '~/features/Toucan/Auction/ActivityTimeline/getSupplySchedulePoints'

function makeStep(mps: number, startBlock: string): AuctionStep {
  return { mps, startBlock } as unknown as AuctionStep
}

const TOTAL_SUPPLY = BigInt(1_000_000)

const baseParams = {
  // Two steps: blocks 100-200 at mps 100, blocks 200-400 at mps 200 → totalMpsBlocks = 50_000
  steps: [makeStep(100, '100'), makeStep(200, '200')],
  endBlock: 400,
  anchorBlock: 100,
  anchorTime: new Date('2025-01-01T00:00:00Z'),
  chainId: 1 as EVMUniverseChainId,
  totalSupplyRaw: TOTAL_SUPPLY,
}

// Wall-clock now consistent with the chain-constant cadence (mainnet 12s blocks), so tests
// not about calibration keep chain-constant timestamps
const constantCadenceNow = (block: number): number =>
  baseParams.anchorTime.getTime() + (block - baseParams.anchorBlock) * 12_000

describe('getSupplySchedulePoints', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns empty for no steps or zero supply', () => {
    expect(getSupplySchedulePoints({ ...baseParams, steps: [] })).toEqual([])
    expect(getSupplySchedulePoints({ ...baseParams, totalSupplyRaw: BigInt(0) })).toEqual([])
  })

  it('generates the target schedule without actualSold', () => {
    const points = getSupplySchedulePoints(baseParams)

    expect(points).toHaveLength(3)
    // No live block → block times fall back to the chain-constant cadence
    expect(points[0].time).toBe(constantCadenceNow(100) / 1000)
    expect(points[2].time).toBe(constantCadenceNow(400) / 1000)
    expect(points[0].value).toBe(0)
    // Step 1: 100 mps × 100 blocks = 10_000 of 50_000 → 20%
    expect(points[1].value).toBe(20)
    expect(points[1].totalReleased).toBe(BigInt(200_000))
    expect(points[2].value).toBe(100)
    expect(points[2].totalReleased).toBe(TOTAL_SUPPLY)
  })

  it('pivots the curve at the current block when supply rolled over', () => {
    vi.setSystemTime(constantCadenceNow(200))
    // At block 200 the schedule expects 20% released (200k), but only 100k actually cleared
    const points = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 200, totalClearedRaw: BigInt(100_000) },
    })

    expect(points).toHaveLength(3)
    // Left of now: passes through the actual cleared amount (10%); block 200 is a real
    // boundary that coincides with now, so it is flagged as the pivot
    expect(points[1].value).toBe(10)
    expect(points[1].totalReleased).toBe(BigInt(100_000))
    expect(points[1].isNowPoint).toBe(true)
    expect(points[2].isProjected).toBe(true)
    // Right of now: remaining 900k distributed over the remaining schedule, still ends at 100%
    expect(points[2].value).toBe(100)
    expect(points[2].totalReleased).toBe(TOTAL_SUPPLY)
  })

  it('inserts a pivot point when the current block is not a step boundary', () => {
    vi.setSystemTime(constantCadenceNow(300))
    // Block 300: scheduled = 10_000 + 200×100 = 30_000 of 50_000 (60% → 600k), actual = 300k
    const points = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 300, totalClearedRaw: BigInt(300_000) },
    })

    expect(points).toHaveLength(4)
    // Boundary at block 200 (scheduled 200k) scaled by 300k/600k → 100k
    expect(points[1].totalReleased).toBe(BigInt(100_000))
    expect(points[1].value).toBe(10)
    // Pivot at block 300 = actual cleared, flagged so the tooltip hides its partial-step slice
    expect(points[2].totalReleased).toBe(BigInt(300_000))
    expect(points[2].value).toBe(30)
    expect(points[2].tokensReleasedInStep).toBe(BigInt(200_000))
    expect(points[2].isNowPoint).toBe(true)
    expect(points[1].isNowPoint).toBeUndefined()
    // Points right of now are projections dependent on future demand
    expect(points[1].isProjected).toBeUndefined()
    expect(points[2].isProjected).toBeUndefined()
    expect(points[3].isProjected).toBe(true)
    // End: remaining 700k over remaining 20_000 mps-blocks → 100%
    expect(points[3].totalReleased).toBe(TOTAL_SUPPLY)
    expect(points[3].value).toBe(100)
    expect(points[3].tokensReleasedInStep).toBe(BigInt(700_000))
  })

  it('ignores actualSold outside the auction range', () => {
    vi.setSystemTime(constantCadenceNow(400))
    const target = getSupplySchedulePoints(baseParams)

    const beforeStart = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 50, totalClearedRaw: BigInt(100_000) },
    })
    const afterEnd = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 400, totalClearedRaw: BigInt(100_000) },
    })

    expect(beforeStart).toEqual(target)
    expect(afterEnd).toEqual(target)
  })

  it('keeps the deterministic target schedule when fully subscribed', () => {
    vi.setSystemTime(constantCadenceNow(200))
    const target = getSupplySchedulePoints(baseParams)

    // Cleared exactly on schedule at block 200 (200k) — no rollover, no projected treatment
    const onSchedule = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 200, totalClearedRaw: BigInt(200_000) },
    })
    // Within rounding tolerance of the schedule
    const nearSchedule = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 200, totalClearedRaw: BigInt(199_990) },
    })

    expect(onSchedule).toEqual(target)
    expect(nearSchedule).toEqual(target)
  })

  it('treats cleared amounts above the schedule as fully subscribed', () => {
    vi.setSystemTime(constantCadenceNow(200))
    const points = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 200, totalClearedRaw: BigInt(2_000_000) },
    })

    // No shortfall → deterministic target schedule, capped at total supply
    expect(points).toEqual(getSupplySchedulePoints(baseParams))
  })

  it('calibrates block times against the live block so the pivot lands at wall-clock now', () => {
    // 200 blocks elapsed in 24s → 120ms/block, 100× faster than the 12s chain constant
    const now = baseParams.anchorTime.getTime() + 24_000
    vi.setSystemTime(now)

    const points = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 300, totalClearedRaw: BigInt(300_000) },
    })

    const nowPoint = points.find((p) => p.isNowPoint)
    expect(nowPoint?.time).toBe(now / 1000)
    // Projected end at the calibrated rate: 300 blocks × 120ms past the anchor
    expect(points[points.length - 1].time).toBe((baseParams.anchorTime.getTime() + 36_000) / 1000)
  })

  it('derives the end time from the calibrated rate once the auction has ended on-chain', () => {
    // Current block already past endBlock; 400 blocks elapsed in 16s → 40ms/block
    const now = baseParams.anchorTime.getTime() + 16_000
    vi.setSystemTime(now)

    const points = getSupplySchedulePoints({
      ...baseParams,
      actualSold: { currentBlock: 500, totalClearedRaw: TOTAL_SUPPLY },
    })

    // No pivot post-end, and the end block maps to a time already in the past
    expect(points.some((p) => p.isNowPoint)).toBe(false)
    expect(points[points.length - 1].time).toBe((baseParams.anchorTime.getTime() + 12_000) / 1000)
    expect((points[points.length - 1].time as number) * 1000).toBeLessThan(now)
  })
})
