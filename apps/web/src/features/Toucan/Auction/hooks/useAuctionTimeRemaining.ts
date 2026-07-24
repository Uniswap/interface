import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'
import { useMachineTimeMs } from '~/hooks/useMachineTime'

export type AuctionPhase = 'notStarted' | 'preBid' | 'live' | 'completed'

interface AuctionTimeRemainingData {
  durationString: string | undefined // Phrased string: "Starting in 1d 2h", "1d 2h 3m", "Completed 24m ago", or "—"
  // Bare time for the phase: countdown to start, time remaining, or completion recency ("24m ago").
  timeString: string | undefined
  progressPercentage: number // 0-100
  phase: AuctionPhase | undefined
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
  preBidEndBlockTimestamp,
}: {
  startBlockTimestamp: bigint | undefined
  endBlockTimestamp: bigint | undefined
  /** When pre-bidding ends. Absent (or equal to start) means no pre-bid window. */
  preBidEndBlockTimestamp?: bigint
}): AuctionTimeRemainingData {
  // Update current time every second for smooth countdown
  const currentTime = useMachineTimeMs(ONE_SECOND_MS)
  const { t } = useTranslation()

  const endTimestampMs = endBlockTimestamp ? Number(endBlockTimestamp) * 1000 : 0
  // Abbreviated, tx-history style recency (e.g. "24m", "3d") used once an auction has completed.
  const completedAgo = useAbbreviatedTimeString(endTimestampMs)

  return useMemo(() => {
    // Validate required data
    if (!startBlockTimestamp || !endBlockTimestamp) {
      return {
        durationString: undefined,
        timeString: undefined,
        progressPercentage: 0,
        phase: undefined,
      }
    }

    const startTimestampMs = Number(startBlockTimestamp) * 1000

    // Determine auction state
    if (currentTime < startTimestampMs) {
      // NOT_STARTED: Auction hasn't begun yet
      const durationString = getDurationRemainingString(startTimestampMs, currentTime)
      return {
        durationString: t('toucan.auction.startingIn', {
          duration: durationString,
        }),
        timeString: durationString,
        progressPercentage: 0,
        phase: 'notStarted' as const,
      }
    }

    if (currentTime >= endTimestampMs) {
      // COMPLETED: surface completion recency instead of a static "Completed".
      const timeString = t('toucan.auction.timeAgo', { time: completedAgo })
      return {
        durationString: t('toucan.auction.completedAgo', { time: completedAgo }),
        timeString,
        progressPercentage: 100,
        phase: 'completed' as const,
      }
    }

    // IN_PROGRESS: Auction is active
    const durationString = getDurationRemainingString(endTimestampMs, currentTime)

    // Calculate progress percentage
    const totalDuration = endTimestampMs - startTimestampMs
    const elapsed = currentTime - startTimestampMs
    const progressPercentage = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0

    // PRE_BID: live but token emission hasn't begun — count down to when pre-bidding ends.
    // durationString keeps the end-of-auction countdown so chip/banner consumers are unaffected.
    const preBidEndTimestampMs = preBidEndBlockTimestamp ? Number(preBidEndBlockTimestamp) * 1000 : 0
    if (currentTime < preBidEndTimestampMs) {
      return {
        durationString,
        timeString: getDurationRemainingString(preBidEndTimestampMs, currentTime),
        progressPercentage,
        phase: 'preBid' as const,
      }
    }

    return {
      durationString,
      timeString: durationString,
      progressPercentage,
      phase: 'live' as const,
    }
  }, [t, startBlockTimestamp, endBlockTimestamp, preBidEndBlockTimestamp, endTimestampMs, currentTime, completedAgo])
}
