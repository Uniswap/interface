import { useRef } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import useMachineTimeMs from '~/hooks/useMachineTime'

const SYNC_THRESHOLD_MS = 20 * ONE_MINUTE_MS // 20 minutes

export function useDurationRemaining(chainId: EVMUniverseChainId | undefined, targetBlock: number | undefined) {
  const targetBlockTimestamp = useBlockTimestamp({
    chainId,
    blockNumber: targetBlock,
    watch: true,
  })

  // Capture initial timestamp for smooth countdown when >20 minutes away
  const initialTargetTimestampRef = useRef<number | undefined>(undefined)
  // Track which targetBlock the ref was captured for, to reset when navigating between auctions
  const capturedForBlockRef = useRef<number | undefined>(undefined)

  if (targetBlockTimestamp && (!initialTargetTimestampRef.current || capturedForBlockRef.current !== targetBlock)) {
    initialTargetTimestampRef.current = Number(targetBlockTimestamp) * 1000
    capturedForBlockRef.current = targetBlock
  }

  // Update current time every second for smooth countdown
  const currentTime = useMachineTimeMs(ONE_SECOND_MS)

  if (!targetBlockTimestamp) {
    return undefined
  }

  const targetTimestampMs = Number(targetBlockTimestamp) * 1000
  const timeRemaining = targetTimestampMs - currentTime

  // Stop countdown at 0 - don't show negative durations ("ago")
  if (timeRemaining <= 0) {
    return undefined
  }

  // If >20 minutes away, use initial captured timestamp for perfectly smooth countdown (no block sync drift)
  // If ≤20 minutes away, re-sync with each block for accuracy near critical moments
  const effectiveTargetTimestamp =
    timeRemaining > SYNC_THRESHOLD_MS ? (initialTargetTimestampRef.current ?? targetTimestampMs) : targetTimestampMs

  return getDurationRemainingString(effectiveTargetTimestamp, currentTime)
}
