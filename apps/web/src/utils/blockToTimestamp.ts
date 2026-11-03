import { BLOCK_TIME_SCHEDULE_BY_CHAIN, blocksToSeconds } from '@uniswap/liquidity-launcher-sdk'
import { EVMUniverseChainId } from '@universe/chains'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { getAverageBlockTimeMs } from '~/utils/averageBlockTimeMs'

function hasBlockTimeSchedule(chainId: number | undefined): chainId is number {
  return chainId !== undefined && chainId in BLOCK_TIME_SCHEDULE_BY_CHAIN
}

/**
 * Wall-clock milliseconds from `fromBlock` to `toBlock` (negative when `toBlock < fromBlock`).
 * Chains whose cadence changed at a hard fork (Base Denim: 2s → 200ms) follow the
 * liquidity-launcher SDK's block-time schedule, so a span crossing the change is exact; every other
 * chain uses its chain-constant `blockTimeMs`. Non-integer input (e.g. a NaN from an unparsed
 * block) takes the constant-rate path so it yields NaN rather than throwing.
 */
export function blockSpanMs({
  chainId,
  fromBlock,
  toBlock,
}: {
  chainId: number | undefined
  fromBlock: number
  toBlock: number
}): number {
  if (hasBlockTimeSchedule(chainId) && Number.isSafeInteger(fromBlock) && Number.isSafeInteger(toBlock)) {
    return blocksToSeconds(chainId, BigInt(fromBlock), BigInt(toBlock)) * ONE_SECOND_MS
  }
  return (toBlock - fromBlock) * getAverageBlockTimeMs(chainId)
}

/**
 * Converts a block number to a Date using an anchor block/timestamp pair.
 * Works for both past and future blocks relative to the anchor.
 *
 * @param block - The target block number
 * @param anchorBlock - The known anchor block number (e.g. creationBlock)
 * @param anchorTime - The known timestamp for the anchor block (e.g. createdAt)
 * @param chainId - Chain ID for chain-specific block times
 * @returns Estimated Date for the target block
 */
export function blockToTimestamp({
  block,
  anchorBlock,
  anchorTime,
  chainId,
}: {
  block: number
  anchorBlock: number
  anchorTime: Date
  chainId: EVMUniverseChainId
}): Date {
  return new Date(anchorTime.getTime() + blockSpanMs({ chainId, fromBlock: anchorBlock, toBlock: block }))
}

/**
 * Like blockToTimestamp, but calibrates the block rate from a second live anchor
 * (currentBlock observed at currentTime). Needed on demand-driven-block chains
 * (e.g. Arbitrum Orbit) where the real cadence can differ several-fold from the
 * chain-constant blockTimeMs. Interpolates between the anchors and extrapolates
 * past currentBlock at the calibrated rate; falls back to the chain constant when
 * no usable live anchor is available.
 *
 * Chains with a block-time schedule produce blocks at a protocol-fixed cadence, so
 * they skip calibration and convert from the anchor along the schedule: an average
 * rate measured across a cadence change fits neither side of it, and the live pair
 * may be a stale block observed at wall-clock time, which would shift every result.
 */
export function calibratedBlockToTimestamp({
  block,
  anchorBlock,
  anchorTime,
  chainId,
  currentBlock,
  currentTime,
}: {
  block: number
  anchorBlock: number
  anchorTime: Date
  chainId: EVMUniverseChainId
  currentBlock?: number
  currentTime?: Date
}): Date {
  const anchorMs = anchorTime.getTime()
  const currentMs = currentTime?.getTime()
  if (
    hasBlockTimeSchedule(chainId) ||
    currentBlock === undefined ||
    currentMs === undefined ||
    currentBlock <= anchorBlock ||
    currentMs <= anchorMs
  ) {
    return blockToTimestamp({ block, anchorBlock, anchorTime, chainId })
  }
  const msPerBlock = (currentMs - anchorMs) / (currentBlock - anchorBlock)
  return new Date(anchorMs + (block - anchorBlock) * msPerBlock)
}
