import { AuctionStep } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { UTCTimestamp } from 'lightweight-charts'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { calibratedBlockToTimestamp } from '~/features/Toucan/Auction/utils/blockToTimestamp'

export interface SupplySchedulePoint {
  time: UTCTimestamp
  value: number // percentage 0-100
  // Metadata for tooltip
  tokensReleasedInStep: bigint // raw tokens released in this step
  totalReleased: bigint // cumulative raw tokens released
  // Pivot inserted at the current block during rollover adjustment. Not a real step
  // boundary — its per-step delta is an arbitrary slice, so the tooltip hides it.
  isNowPoint?: boolean
  // Right of the now pivot: amounts assume future demand absorbs the remaining supply
  isProjected?: boolean
}

interface ActualSold {
  currentBlock: number
  totalClearedRaw: bigint
}

/**
 * Generates supply schedule data points from parsedAuctionSteps.
 *
 * mps = tokens released per block during a step.
 * Cumulative tokens at step boundary i = sum of (mps_j × blocks_in_step_j) for j < i.
 * Total tokens across all steps = totalMpsBlocks (denominator for percentage).
 *
 * With supply rollover, tokens that don't clear roll into later blocks, so the target
 * schedule no longer matches reality once the auction is live. When `actualSold` is
 * provided (live auction), the curve is adjusted around the current block:
 * - Left of now: scaled so it passes through the actual amount cleared (totalCleared).
 * - Right of now: the remaining supply is distributed proportionally across the
 *   remaining schedule, so the curve still ends at 100%.
 */
export function getSupplySchedulePoints({
  steps,
  endBlock,
  anchorBlock,
  anchorTime,
  chainId,
  totalSupplyRaw,
  actualSold,
}: {
  steps: AuctionStep[]
  endBlock: number
  anchorBlock: number
  anchorTime: Date
  chainId: EVMUniverseChainId
  totalSupplyRaw: bigint
  actualSold?: ActualSold
}): SupplySchedulePoint[] {
  if (steps.length === 0 || totalSupplyRaw === BigInt(0)) {
    return []
  }

  // Calibrate block→time against the live block when available: on demand-driven-block
  // chains the chain-constant block time can be off several-fold, which would place the
  // now pivot (and the projected end time) far from the wall-clock "Now" marker.
  const currentTime = actualSold ? new Date() : undefined
  const toTimestamp = (block: number): UTCTimestamp =>
    (calibratedBlockToTimestamp({
      block,
      anchorBlock,
      anchorTime,
      chainId,
      currentBlock: actualSold?.currentBlock,
      currentTime,
    }).getTime() / 1000) as UTCTimestamp

  // Cumulative mps×blocks at each step boundary; last entry = 100% denominator
  const startBlock = Number(steps[0].startBlock)
  const boundaries: Array<{ block: number; cumulativeMpsBlocks: bigint }> = [
    { block: startBlock, cumulativeMpsBlocks: BigInt(0) },
  ]
  let cumulativeMpsBlocks = BigInt(0)
  for (let i = 0; i < steps.length; i++) {
    const stepStartBlock = Number(steps[i].startBlock)
    const stepEndBlock = i < steps.length - 1 ? Number(steps[i + 1].startBlock) : endBlock
    const mps = steps[i].mps ? BigInt(steps[i].mps) : BigInt(0)
    cumulativeMpsBlocks += mps * BigInt(stepEndBlock - stepStartBlock)
    boundaries.push({ block: stepEndBlock, cumulativeMpsBlocks })
  }

  const totalMpsBlocks = cumulativeMpsBlocks
  if (totalMpsBlocks === BigInt(0)) {
    return []
  }

  // Scheduled cumulative mps×blocks at an arbitrary block (linear within a step)
  const scheduledMpsBlocksAt = (block: number): bigint => {
    let result = BigInt(0)
    for (let i = 0; i < steps.length; i++) {
      const stepStartBlock = Number(steps[i].startBlock)
      const stepEndBlock = i < steps.length - 1 ? Number(steps[i + 1].startBlock) : endBlock
      const mps = steps[i].mps ? BigInt(steps[i].mps) : BigInt(0)
      const blocksElapsed = Math.min(Math.max(block - stepStartBlock, 0), stepEndBlock - stepStartBlock)
      result += mps * BigInt(blocksElapsed)
    }
    return result
  }

  const scheduledMpsBlocksAtNow = actualSold ? scheduledMpsBlocksAt(actualSold.currentBlock) : BigInt(0)

  const clearedRaw = actualSold
    ? actualSold.totalClearedRaw < totalSupplyRaw
      ? actualSold.totalClearedRaw
      : totalSupplyRaw
    : BigInt(0)

  // A fully subscribed auction clears exactly on schedule, so the remaining release is
  // deterministic — no adjustment or projected treatment. Only a shortfall (rollover)
  // bends the curve. Small tolerance absorbs integer-division rounding.
  const scheduledReleasedAtNow = (scheduledMpsBlocksAtNow * totalSupplyRaw) / totalMpsBlocks
  const hasShortfall = clearedRaw < (scheduledReleasedAtNow * BigInt(9999)) / BigInt(10000)

  // Rollover adjustment only applies mid-auction with a known cleared amount
  const applyActual =
    actualSold !== undefined &&
    actualSold.currentBlock > startBlock &&
    actualSold.currentBlock < endBlock &&
    scheduledMpsBlocksAtNow > BigInt(0) &&
    scheduledMpsBlocksAtNow < totalMpsBlocks &&
    hasShortfall

  const tokensReleasedAt = (mpsBlocks: bigint): bigint => {
    if (!applyActual) {
      return (mpsBlocks * totalSupplyRaw) / totalMpsBlocks
    }
    if (mpsBlocks <= scheduledMpsBlocksAtNow) {
      // Before now: scale the schedule so it passes through the actual cleared amount
      return (clearedRaw * mpsBlocks) / scheduledMpsBlocksAtNow
    }
    // After now: distribute the remaining supply over the remaining schedule
    return (
      clearedRaw +
      ((totalSupplyRaw - clearedRaw) * (mpsBlocks - scheduledMpsBlocksAtNow)) /
        (totalMpsBlocks - scheduledMpsBlocksAtNow)
    )
  }

  const pointBlocks: Array<{ block: number; mpsBlocks: bigint; isNowPoint?: boolean }> = boundaries.map((b) => ({
    block: b.block,
    mpsBlocks: b.cumulativeMpsBlocks,
    ...(applyActual && b.block === actualSold.currentBlock ? { isNowPoint: true } : {}),
  }))
  if (applyActual && !boundaries.some((b) => b.block === actualSold.currentBlock)) {
    // Insert a point at the current block so the curve pivots exactly at the now line
    const insertIndex = pointBlocks.findIndex((p) => p.block > actualSold.currentBlock)
    pointBlocks.splice(insertIndex, 0, {
      block: actualSold.currentBlock,
      mpsBlocks: scheduledMpsBlocksAtNow,
      isNowPoint: true,
    })
  }

  const points: SupplySchedulePoint[] = []
  let previousReleased = BigInt(0)
  for (const { block, mpsBlocks, isNowPoint } of pointBlocks) {
    const totalReleased = tokensReleasedAt(mpsBlocks)
    const isProjected = applyActual && block > actualSold.currentBlock
    points.push({
      time: toTimestamp(block),
      value: Number((totalReleased * BigInt(10000)) / totalSupplyRaw) / 100,
      tokensReleasedInStep: totalReleased - previousReleased,
      totalReleased,
      ...(isNowPoint ? { isNowPoint } : {}),
      ...(isProjected ? { isProjected } : {}),
    })
    previousReleased = totalReleased
  }

  return points
}
