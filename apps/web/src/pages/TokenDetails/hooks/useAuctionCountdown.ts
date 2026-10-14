import { useEffect } from 'react'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSharedMachineTimeMs } from 'utilities/src/time/useSharedMachineTimeMs'

/**
 * Second-resolution "3h 59m 22s" string until `endsAtMs`, clamped at zero. `onComplete` fires once when the
 * clock crosses the estimate so the caller can re-read the chain head — the phase itself never comes from the clock.
 */
export function useAuctionCountdown({
  endsAtMs,
  onComplete,
}: {
  endsAtMs: number | undefined
  onComplete: () => void
}): string | undefined {
  const now = useSharedMachineTimeMs(ONE_SECOND_MS)
  const isComplete = endsAtMs !== undefined && now >= endsAtMs

  useEffect(() => {
    if (isComplete) {
      onComplete()
    }
    // A replaced end time that has already passed must fire again.
  }, [isComplete, endsAtMs, onComplete])

  return endsAtMs === undefined ? undefined : getDurationRemainingString(Math.max(endsAtMs, now), now)
}
