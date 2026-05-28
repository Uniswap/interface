import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { AVERAGE_L2_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'

/**
 * Estimates the timestamp for a future block using current block data and average block time.
 * Extracted from useBlockTimestamp to be reusable across hooks.
 *
 * @param params - Parameters for estimation
 * @param params.targetBlockNumber - The future block number to estimate
 * @param params.currentBlockNumber - The current block number
 * @param params.currentBlockTimestamp - The current block's timestamp (in seconds)
 * @param params.chainId - The chain ID (used to get chain-specific block time)
 * @returns Estimated timestamp in seconds, or undefined if parameters are invalid
 */
export function estimateFutureBlockTimestamp({
  targetBlockNumber,
  currentBlockNumber,
  currentBlockTimestamp,
  chainId,
}: {
  targetBlockNumber: number | bigint
  currentBlockNumber: number | bigint
  currentBlockTimestamp: bigint
  chainId: EVMUniverseChainId
}): bigint | undefined {
  const targetBlock = typeof targetBlockNumber === 'bigint' ? Number(targetBlockNumber) : targetBlockNumber
  const currentBlock = typeof currentBlockNumber === 'bigint' ? Number(currentBlockNumber) : currentBlockNumber

  const blockDifference = targetBlock - currentBlock
  if (blockDifference <= 0) {
    return undefined
  }

  // Use chain-specific average block time
  const chainInfo = getChainInfo(chainId)
  const averageBlockTimeMs = chainInfo.blockTimeMs ?? AVERAGE_L2_BLOCK_TIME_MS
  const averageBlockTimeSeconds = averageBlockTimeMs / 1000

  const estimatedTimeUntilTarget = BigInt(Math.floor(blockDifference * averageBlockTimeSeconds))
  return currentBlockTimestamp + estimatedTimeUntilTarget
}
