import { SwapEventName } from '@uniswap/analytics-events'
import { SignatureType } from 'state/signatures/types'
import { TransactionType } from 'state/transactions/types'
import { logSwapFinalized, logUniswapXSwapFinalized } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import { TransactionOriginType } from 'uniswap/src/features/transactions/types/transactionDetails'

jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

jest.mock('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker', () => ({
  ...jest.requireActual('uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'),
  timestampTracker: {
    hasTimestamp: () => false,
    setElapsedTime: () => 100,
    getElapsedTime: () => 100,
  },
}))

describe('swapFlowLoggers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logSwapSuccess calls sendAnalyticsEvent with correct parameters', () => {
    const mockHash = 'mockHash'
    const mockChainId = 1
    const mockAnalyticsContext = { page: 'mockContext' }

    logSwapFinalized(
      mockHash,
      mockChainId,
      mockChainId,
      mockAnalyticsContext,
      TransactionStatus.Confirmed,
      TransactionType.SWAP,
    )

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
      transactionOriginType: TransactionOriginType.Internal,
      routing: 'classic',
      time_to_swap: 100,
      time_to_swap_since_first_input: 100,
      hash: mockHash,
      chain_id: mockChainId,
      chain_id_in: mockChainId,
      chain_id_out: mockChainId,
      ...mockAnalyticsContext,
    })
  })

  it('logUniswapXSwapSuccess calls sendAnalyticsEvent with correct parameters', () => {
    const mockHash = 'mockHash'
    const mockOrderHash = 'mockOrderHash'
    const mockChainId = 1
    const mockAnalyticsContext = { page: 'mockContext' }

    logUniswapXSwapFinalized(
      mockHash,
      mockOrderHash,
      mockChainId,
      mockAnalyticsContext,
      SignatureType.SIGN_UNISWAPX_V2_ORDER,
      UniswapXOrderStatus.FILLED,
    )

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
      transactionOriginType: TransactionOriginType.Internal,
      routing: 'uniswap_x_v2',
      time_to_swap: 100,
      time_to_swap_since_first_input: 100,
      hash: mockHash,
      order_hash: mockOrderHash,
      chain_id: mockChainId,
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
})
