import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import useMachineTimeMs from '~/hooks/useMachineTime'

interface AuctionTimeRemainingData {
  durationString: string // Duration string: "1d 2h 3m" or "—"
  progressPercentage: number // 0-100
  isCompleted: boolean
  isNotStarted: boolean
}

/**
 * Hook to get real-time auction time remaining data using actual block timestamps.
 * Updates every second for smooth countdown display.
 *
 * @param params - Auction parameters including chainId, startBlock, and endBlock
 * @returns Real-time auction time remaining data
 */
export function useAuctionTimeRemaining({
  chainId,
  startBlock,
  endBlock,
}: {
  chainId: EVMUniverseChainId | undefined
  startBlock: number | undefined
  endBlock: number | undefined
}): AuctionTimeRemainingData {
  // Get actual block timestamps (past blocks from chain, future blocks estimated)
  const startBlockTimestamp = useBlockTimestamp({
    chainId,
    blockNumber: startBlock,
    watch: true,
  })

  const endBlockTimestamp = useBlockTimestamp({
    chainId,
    blockNumber: endBlock,
    watch: true,
  })

  // Update current time every second for smooth countdown
  const currentTime = useMachineTimeMs(ONE_SECOND_MS)

  return useMemo(() => {
    // Validate required data
    if (!startBlockTimestamp || !endBlockTimestamp) {
      return {
        durationString: '—',
        progressPercentage: 0,
        isCompleted: false,
        isNotStarted: false,
      }
    }

    const startTimestampMs = Number(startBlockTimestamp) * 1000
    const endTimestampMs = Number(endBlockTimestamp) * 1000

    // Determine auction state
    if (currentTime < startTimestampMs) {
      // NOT_STARTED: Auction hasn't begun yet
      const durationString = getDurationRemainingString(startTimestampMs, currentTime)
      return {
        durationString,
        progressPercentage: 0,
        isCompleted: false,
        isNotStarted: true,
      }
    }

    if (currentTime >= endTimestampMs) {
      // COMPLETED: Auction has ended
      return {
        durationString: '',
        progressPercentage: 100,
        isCompleted: true,
        isNotStarted: false,
      }
    }

    // IN_PROGRESS: Auction is active
    const durationString = getDurationRemainingString(endTimestampMs, currentTime)

    // Calculate progress percentage
    const totalDuration = endTimestampMs - startTimestampMs
    const elapsed = currentTime - startTimestampMs
    const progressPercentage = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0

    return {
      durationString,
      progressPercentage,
      isCompleted: false,
      isNotStarted: false,
    }
  }, [startBlockTimestamp, endBlockTimestamp, currentTime])
}
