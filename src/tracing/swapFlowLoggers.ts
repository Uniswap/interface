import { SwapEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

/**
 * Returns the time elapsed between page load and now,
 * if the time-to-swap mark doesn't already exist.
 */
function getElapsedTime(markName: string): number {
  const timeToSwap = performance.mark(markName)
  return timeToSwap.startTime
}

// We only log the time-to-swap metric for the first swap of a session.
let hasReportedTimeToSwap = false
export function logSwapSuccess(hash: string, analyticsContext: any) {
  const elapsedTime = getElapsedTime('time-to-swap')
  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    // if timeToSwap was already set, we already logged this session
    time_to_swap: hasReportedTimeToSwap ? undefined : elapsedTime,
    hash,
    ...analyticsContext,
  })

  hasReportedTimeToSwap = true
}


