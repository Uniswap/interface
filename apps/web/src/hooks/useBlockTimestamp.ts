import { useEffect, useMemo, useRef } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
// oxlint-disable-next-line no-restricted-imports -- Use wagmi version because it supports a chain being passed in
import { useBlock, useBlockNumber } from 'wagmi'
import { calibratedBlockToTimestamp } from '~/utils/blockToTimestamp'

/**
 * Gets the timestamp for a specific block number
 * For past blocks, uses wagmi's useBlock hook
 * For future blocks, estimates timestamp using current block and average block time
 * @param params - The block query parameters
 * @param params.chainId - The EVM chain ID to query (wagmi only supports EVM chains)
 * @param params.blockNumber - The block number to get the timestamp for
 * @param params.watch - Whether to watch for block updates (default: false)
 * @param params.anchorBlock - Known past-block anchor (e.g. auction creation block) for calibrating the future-block rate
 * @param params.anchorTime - Timestamp of the anchor block; paired with anchorBlock to derive the real block rate
 * @returns The block timestamp as a bigint, or undefined if not available
 */
export function useBlockTimestamp({
  chainId,
  blockNumber,
  watch = false,
  anchorBlock,
  anchorTime,
}: {
  chainId: EVMUniverseChainId | undefined
  blockNumber: number | undefined
  watch?: boolean
  anchorBlock?: number
  anchorTime?: Date
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

  // For future blocks, estimate the timestamp via the shared calibrated conversion. With an
  // anchor (a known past block/time, e.g. the auction creation block) the block rate is
  // calibrated against the live block, so demand-driven-block chains (e.g. Robinhood) don't
  // inherit the several-fold-wrong chain-constant rate. Without an anchor it collapses to the
  // chain-constant rate extrapolated from the live block (previous behavior).
  const estimatedFutureTimestamp = useMemo(() => {
    if (!blockNumber || !currentBlockTimestamp || !chainId || !currentBlockNumber) {
      return undefined
    }

    const currentBlock = Number(currentBlockNumber)
    const currentTimeMs = Number(currentBlockTimestamp) * 1000
    const estimated = calibratedBlockToTimestamp({
      block: blockNumber,
      anchorBlock: anchorBlock ?? currentBlock,
      anchorTime: anchorTime ?? new Date(currentTimeMs),
      chainId,
      currentBlock,
      currentTime: new Date(currentTimeMs),
    })
    const estimatedMs = estimated.getTime()
    return Number.isFinite(estimatedMs) ? BigInt(Math.floor(estimatedMs / 1000)) : undefined
  }, [blockNumber, currentBlockNumber, currentBlockTimestamp, chainId, anchorBlock, anchorTime])

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
