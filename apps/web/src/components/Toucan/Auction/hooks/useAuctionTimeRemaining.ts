import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import useMachineTimeMs from '~/hooks/useMachineTime'

interface AuctionTimeRemainingData {
  durationString: string | undefined // Duration string: "1d 2h 3m" or "—"
  progressPercentage: number // 0-100
}

/**
 * Hook to get real-time auction time remaining data using actual block timestamps.
 * Updates every second for smooth countdown display.
 *
 * @param params - Auction parameters including chainId, startBlock, endBlock, and optional pre-fetched endBlockTimestamp
 * @returns Real-time auction time remaining data
 */
export function useAuctionTimeRemaining({
  startBlockTimestamp,
  endBlockTimestamp,
}: {
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
}): AuctionTimeRemainingData {
  // Update current time every second for smooth countdown
  const currentTime = useMachineTimeMs(ONE_SECOND_MS)
  const { t } = useTranslation()

  return useMemo(() => {
    // Validate required data
    if (!startBlockTimestamp || !endBlockTimestamp) {
      return {
        durationString: undefined,
        progressPercentage: 0,
      }
    }

    const startTimestampMs = Number(startBlockTimestamp) * 1000
    const endTimestampMs = Number(endBlockTimestamp) * 1000

    // Determine auction state
    if (currentTime < startTimestampMs) {
      // NOT_STARTED: Auction hasn't begun yet
      const durationString = getDurationRemainingString(startTimestampMs, currentTime)
      return {
        durationString: t('toucan.auction.startingIn', {
          duration: durationString,
        }),
        progressPercentage: 0,
      }
    }

    if (currentTime >= endTimestampMs) {
      // COMPLETED: Auction has ended
      return {
        durationString: t('toucan.auction.timeRemaining.completed'),
        progressPercentage: 100,
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
    }
  }, [t, startBlockTimestamp, endBlockTimestamp, currentTime])
}
