import { SwapEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'

jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

jest.mock('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker', () => ({
  ...jest.requireActual('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'),
  timestampTracker: {
    hasTimestamp: (): boolean => false,
    setElapsedTime: (): number => 100,
    getElapsedTime: (): number => 100,
  },
}))

describe('analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('logSwapQuoteRequest calls sendAnalyticsEvent with correct parameters', () => {
    const mockChainId = 1

    logSwapQuoteFetch({ chainId: mockChainId })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_QUOTE_FETCH, {
      chainId: mockChainId,
      isQuickRoute: false,
      time_to_first_quote_request: 100,
      time_to_first_quote_request_since_first_input: 100,
    })
  })

  it('logSwapQuoteRequest excludes perf metrics for price quotes', () => {
    const mockChainId = 1

    logSwapQuoteFetch({ chainId: mockChainId, isUSDQuote: true })

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_QUOTE_FETCH, {
      chainId: mockChainId,
      isQuickRoute: false,
    })
  })
})
