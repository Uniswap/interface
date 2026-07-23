import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { AVERAGE_L2_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'

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
}) {
  const chainInfo = getChainInfo(chainId)
  const blockTimeMs = chainInfo.blockTimeMs ?? AVERAGE_L2_BLOCK_TIME_MS
  const secPerBlock = blockTimeMs / 1000

  const deltaSec = (block - anchorBlock) * secPerBlock
  return new Date(anchorTime.getTime() + deltaSec * 1000)
}

/**
 * Like blockToTimestamp, but calibrates the block rate from a second live anchor
 * (currentBlock observed at currentTime). Needed on demand-driven-block chains
 * (e.g. Arbitrum Orbit) where the real cadence can differ several-fold from the
 * chain-constant blockTimeMs. Interpolates between the anchors and extrapolates
 * past currentBlock at the calibrated rate; falls back to the chain constant when
 * no usable live anchor is available.
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
  if (currentBlock === undefined || currentMs === undefined || currentBlock <= anchorBlock || currentMs <= anchorMs) {
    return blockToTimestamp({ block, anchorBlock, anchorTime, chainId })
  }
  const msPerBlock = (currentMs - anchorMs) / (currentBlock - anchorBlock)
  return new Date(anchorMs + (block - anchorBlock) * msPerBlock)
}
