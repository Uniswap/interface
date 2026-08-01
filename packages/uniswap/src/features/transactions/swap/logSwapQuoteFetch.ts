import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { logger } from 'utilities/src/logger/logger'

export function logSwapQuoteFetch({
  chainId,
  isUSDQuote = false,
  isQuickRoute = false,
  quoteSource,
  pollInterval,
}: {
  chainId: number
  isUSDQuote?: boolean
  isQuickRoute?: boolean
  quoteSource?: 'routing_api' | 'trading_api'
  pollInterval?: number
}): void {
  let performanceMetrics = {}
  if (!isUSDQuote) {
    const hasSetSwapQuote = timestampTracker.hasTimestamp(SwapEventType.FirstQuoteFetchStarted)
    const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstQuoteFetchStarted)

    // We only log the time_to_first_quote_request metric for the first quote request of a session.
    const time_to_first_quote_request = hasSetSwapQuote ? undefined : elapsedTime
    const time_to_first_quote_request_since_first_input = hasSetSwapQuote
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstQuoteFetchStarted, SwapEventType.FirstSwapAction)

    performanceMetrics = { time_to_first_quote_request, time_to_first_quote_request_since_first_input }
  }
  sendAnalyticsEvent(SwapEventName.SwapQuoteFetch, {
    chainId,
    isQuickRoute,
    isUSDQuote,
    quoteSource,
    pollInterval,
    ...performanceMetrics,
  })
  logger.info('analytics', 'logSwapQuoteFetch', SwapEventName.SwapQuoteFetch, {
    chainId,
    // we explicitly log it here to show on Datadog dashboard
    chainLabel: getChainLabel(chainId),
    isQuickRoute,
    isUSDQuote,
    quoteSource,
    pollInterval,
    ...performanceMetrics,
  })
}
