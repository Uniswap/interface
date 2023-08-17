import { SwapEventName } from '@uniswap/analytics-events'
import { ITraceContext } from 'analytics'
import { sendAnalyticsEvent } from 'analytics'

import { SwapEventTimestampTracker, SwapEventType } from './SwapEventTimestampTracker'

const tracker = SwapEventTimestampTracker.getInstance()

export function logSwapSuccess(hash: string, chainId: number, analyticsContext: ITraceContext) {
  const hasSetSwapSuccess = tracker.hasTimestamp(SwapEventType.FIRST_SWAP_SUCCESS)
  const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)
  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : tracker.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS, SwapEventType.FIRST_SWAP_ACTION),
    hash,
    chainId,
    ...analyticsContext,
  })
}

// We only log the time-to-first-swap-input metric for the first swap input of a session.
export function maybeLogFirstSwapAction(analyticsContext: ITraceContext) {
  if (!tracker.hasTimestamp(SwapEventType.FIRST_SWAP_ACTION)) {
    const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_SWAP_ACTION)
    sendAnalyticsEvent(SwapEventName.SWAP_FIRST_ACTION, {
      time_to_first_swap_action: elapsedTime,
      ...analyticsContext,
    })
  }
}
