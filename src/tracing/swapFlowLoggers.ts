import { SwapEventName } from '@uniswap/analytics-events'
import { ITraceContext } from 'analytics'
import { sendAnalyticsEvent } from 'analytics'
import { INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/types'

import { SwapEventType, timestampTracker } from './SwapEventTimestampTracker'

export function logSwapSuccess(hash: string, chainId: number, analyticsContext: ITraceContext) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FIRST_SWAP_SUCCESS)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS)
  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FIRST_SWAP_SUCCESS, SwapEventType.FIRST_SWAP_ACTION),
    hash,
    chainId,
    ...analyticsContext,
  })
}

// We only log the time-to-first-swap-input metric for the first swap input of a session.
export function maybeLogFirstSwapAction(analyticsContext: ITraceContext) {
  if (!timestampTracker.hasTimestamp(SwapEventType.FIRST_SWAP_ACTION)) {
    const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FIRST_SWAP_ACTION)
    sendAnalyticsEvent(SwapEventName.SWAP_FIRST_ACTION, {
      time_to_first_swap_action: elapsedTime,
      ...analyticsContext,
    })
  }
}

export function logSwapQuoteRequest(
  chainId: number,
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE,
  isQuickRoute?: boolean
) {
  let performanceMetrics = {}
  if (routerPreference !== INTERNAL_ROUTER_PREFERENCE_PRICE) {
    const hasSetSwapQuote = timestampTracker.hasTimestamp(SwapEventType.FIRST_QUOTE_FETCH_STARTED)
    const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FIRST_QUOTE_FETCH_STARTED)
    performanceMetrics = {
      // We only log the time_to_first_quote_request metric for the first quote request of a session.
      time_to_first_quote_request: hasSetSwapQuote ? undefined : elapsedTime,
      time_to_first_quote_request_since_first_input: hasSetSwapQuote
        ? undefined
        : timestampTracker.getElapsedTime(SwapEventType.FIRST_QUOTE_FETCH_STARTED, SwapEventType.FIRST_SWAP_ACTION),
    }
  }
  sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_FETCH, {
    chainId,
    isQuickRoute: isQuickRoute ?? false,
    ...performanceMetrics,
  })
}
