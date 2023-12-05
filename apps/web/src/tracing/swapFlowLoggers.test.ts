import { SwapEventName } from '@uniswap/analytics-events'
import { sendAnalyticsEvent } from 'analytics'

jest.mock('analytics', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

jest.mock('./SwapEventTimestampTracker', () => ({
  SwapEventType: {
    FIRST_SWAP_ACTION: 'FIRST_SWAP_ACTION',
    FIRST_QUOTE_FETCH_STARTED: 'FIRST_QUOTE_FETCH_STARTED',
    FIRST_SWAP_SIGNATURE_REQUESTED: 'FIRST_SWAP_SIGNATURE_REQUESTED',
    FIRST_SWAP_SIGNATURE_COMPLETED: 'FIRST_SWAP_SIGNATURE_COMPLETED',
    FIRST_SWAP_SUCCESS: 'FIRST_SWAP_SUCCESS',
  },
  timestampTracker: {
    hasTimestamp: () => false,
    setElapsedTime: () => 100,
    getElapsedTime: () => 100,
  },
}))

import { INTERNAL_ROUTER_PREFERENCE_PRICE, RouterPreference } from 'state/routing/types'

import { logSwapQuoteRequest, logSwapSuccess, maybeLogFirstSwapAction } from './swapFlowLoggers'

describe('swapFlowLoggers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logSwapSuccess calls sendAnalyticsEvent with correct parameters', () => {
    const mockHash = 'mockHash'
    const mockChainId = 1
    const mockAnalyticsContext = { page: 'mockContext' }

    logSwapSuccess(mockHash, mockChainId, mockAnalyticsContext)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
      time_to_swap: 100,
      time_to_swap_since_first_input: 100,
      hash: mockHash,
      chainId: mockChainId,
      ...mockAnalyticsContext,
    })
  })

  it('maybeLogFirstSwapAction calls sendAnalyticsEvent with correct parameters', () => {
    const mockAnalyticsContext = { page: 'mockContext' }

    maybeLogFirstSwapAction(mockAnalyticsContext)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_FIRST_ACTION, {
      time_to_first_swap_action: 100,
      ...mockAnalyticsContext,
    })
  })

  it('logSwapQuoteRequest calls sendAnalyticsEvent with correct parameters', () => {
    const mockChainId = 1

    logSwapQuoteRequest(mockChainId, RouterPreference.X)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_QUOTE_FETCH, {
      chainId: mockChainId,
      isQuickRoute: false,
      time_to_first_quote_request: 100,
      time_to_first_quote_request_since_first_input: 100,
    })
  })

  it('logSwapQuoteRequest excludes perf metrics for price quotes', () => {
    const mockChainId = 1

    logSwapQuoteRequest(mockChainId, INTERNAL_ROUTER_PREFERENCE_PRICE)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_QUOTE_FETCH, {
      chainId: mockChainId,
      isQuickRoute: false,
    })
  })
})
