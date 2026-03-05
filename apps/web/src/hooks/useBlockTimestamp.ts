import { useEffect, useMemo, useRef } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { AVERAGE_L2_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
// biome-ignore lint/style/noRestrictedImports: Use wagmi version because it supports a chain being passed in
import { useBlock, useBlockNumber } from 'wagmi'

/**
 * Gets the timestamp for a specific block number
 * For past blocks, uses wagmi's useBlock hook
 * For future blocks, estimates timestamp using current block and average block time
 * @param params - The block query parameters
 * @param params.chainId - The EVM chain ID to query (wagmi only supports EVM chains)
 * @param params.blockNumber - The block number to get the timestamp for
 * @param params.watch - Whether to watch for block updates (default: false)
 * @returns The block timestamp as a bigint, or undefined if not available
 */
export function useBlockTimestamp({
  chainId,
  blockNumber,
  watch = false,
}: {
  chainId: EVMUniverseChainId | undefined
  blockNumber: number | undefined
  watch?: boolean
}): bigint | undefined {
  // Keep track of the previous valid timestamp to prevent undefined during updates
  const previousTimestampRef = useRef<bigint | undefined>(undefined)
  // Track which blockNumber the cached timestamp is for, to reset when target changes
  const cachedForBlockRef = useRef<number | undefined>(undefined)

  const currentBlockNumber = useBlockNumber({
    chainId,
    watch,
  }).data

  const currentBlockTimestamp = useBlock({
    chainId,
    blockNumber: currentBlockNumber,
  }).data?.timestamp

  const isPastBlock = !!blockNumber && !!currentBlockNumber && blockNumber <= currentBlockNumber
  const { data: pastBlock } = useBlock({
    blockNumber: blockNumber !== undefined && isPastBlock ? BigInt(blockNumber) : undefined,
    chainId,
    watch,
    query: {
      enabled: blockNumber !== undefined && chainId !== undefined && isPastBlock,
    },
  })

  // For future blocks, calculate estimated timestamp
  const estimatedFutureTimestamp = useMemo(() => {
    if (!blockNumber || !currentBlockTimestamp || !chainId || !currentBlockNumber) {
      return undefined
    }

    const blockDifference = blockNumber - Number(currentBlockNumber)
    if (blockDifference <= 0) {
      return undefined
    }

    // Use chain-specific average block time
    const chainInfo = getChainInfo(chainId)
    const averageBlockTimeMs = chainInfo.blockTimeMs ?? AVERAGE_L2_BLOCK_TIME_MS
    const averageBlockTimeSeconds = averageBlockTimeMs / 1000

    const estimatedTimeUntilTarget = BigInt(Math.floor(blockDifference * averageBlockTimeSeconds))
    return currentBlockTimestamp + estimatedTimeUntilTarget
  }, [blockNumber, currentBlockNumber, currentBlockTimestamp, chainId])

  const result = isPastBlock ? pastBlock?.timestamp : estimatedFutureTimestamp

  // Reset cached timestamp when target blockNumber changes (e.g., navigating between auctions)
  // This prevents stale cached values from a previous auction being used
  if (cachedForBlockRef.current !== blockNumber) {
    previousTimestampRef.current = undefined
    cachedForBlockRef.current = blockNumber
  }

  // Update the previous timestamp ref whenever we have a valid result
  useEffect(() => {
    if (result !== undefined) {
      previousTimestampRef.current = result
    }
  }, [result])

  // Return the current result if available, otherwise fall back to previous
  return result !== undefined ? result : previousTimestampRef.current
}
