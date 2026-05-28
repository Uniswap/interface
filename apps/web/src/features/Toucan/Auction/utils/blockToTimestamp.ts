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
