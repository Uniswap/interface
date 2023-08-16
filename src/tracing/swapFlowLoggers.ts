import { SwapEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

import { SwapEventTimestampTracker, SwapEventType } from './SwapEventTimestampTracker'

const tracker = SwapEventTimestampTracker.getInstance()

export function logSwapSuccess(hash: string, chainId: number, analyticsContext: any) {
  const hasSetSwapSuccess = tracker.hasTimestamp(SwapEventType.FIRST_SWAP)
  const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_SWAP)
  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : tracker.getElapsedTime(SwapEventType.FIRST_SWAP, SwapEventType.FIRST_SWAP_ACTION),
    hash,
    chainId,
    ...analyticsContext,
  })
}

// We only log the time-to-first-swap-input metric for the first swap input of a session.
export function maybeLogFirstSwapAction(analyticsContext: any) {
  if (!tracker.hasTimestamp(SwapEventType.FIRST_SWAP_ACTION)) {
    const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_SWAP_ACTION)
    sendAnalyticsEvent(SwapEventName.SWAP_FIRST_ACTION, {
      time_to_first_swap_action: elapsedTime,
      ...analyticsContext,
    })
  }
}

export function logSwapQuoteRequest(chainId: number) {
  const hasSetSwapQuote = tracker.hasTimestamp(SwapEventType.FIRST_QUOTE_FETCH_STARTED)
  const elapsedTime = tracker.setElapsedTime(SwapEventType.FIRST_QUOTE_FETCH_STARTED)
  sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_FETCH, {
    chainId,
    // We only log the time_to_first_quote_request metric for the first quote request of a session.
    time_to_first_quote_request: hasSetSwapQuote ? undefined : elapsedTime,
  })
}
