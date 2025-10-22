import { TradingApi } from '@universe/api'
import { createExternallySubmittedUniswapXOrder } from 'src/app/features/dappRequests/handleUniswapX'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

const mockValues = {
  address: '0x1234567890abcdef',
  orderId: '0xorder123',
  chainId: 1,
  inputToken: 'INPUT_TOKEN',
  outputToken: 'OUTPUT_TOKEN',
  unused: 'unused',
}

describe('handleUniswapX', () => {
  describe('createExternallySubmittedUniswapXOrder', () => {
    const mockFetchLatestOpenOrder = jest.fn()
    const mockWaitForOrder = jest.fn()
    const mockAddTxToWatcher = jest.fn()

    const mockContext = {
      addTxToWatcher: mockAddTxToWatcher,
      fetchLatestOpenOrder: mockFetchLatestOpenOrder,
      waitForOrder: mockWaitForOrder,
    }

    const mockOrderResponse: TradingApi.GetOrdersResponse = {
      requestId: mockValues.unused,
      orders: [
        {
          chainId: mockValues.chainId,
          orderId: mockValues.orderId,
          orderStatus: TradingApi.OrderStatus.OPEN,
          type: TradingApi.OrderType.DUTCH_V2,
          input: {
            token: mockValues.inputToken,
            startAmount: '1000000',
          },
          outputs: [
            {
              token: mockValues.outputToken,
              startAmount: '500000000000000000',
            },
          ],
          quoteId: 'quote123',
          encodedOrder: mockValues.unused,
          signature: mockValues.unused,
          nonce: mockValues.unused,
        },
      ],
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should process a valid order and add it to the transaction watcher', async () => {
      mockFetchLatestOpenOrder.mockResolvedValue(mockOrderResponse)
      await createExternallySubmittedUniswapXOrder(mockContext)(mockValues.address)

      expect(mockWaitForOrder).toHaveBeenCalled()
      expect(mockFetchLatestOpenOrder).toHaveBeenCalledWith(mockValues.address) // Verify addTxToWatcher was called with the correct transaction details
      expect(mockAddTxToWatcher).toHaveBeenCalledTimes(1)

      const txDetails = mockAddTxToWatcher.mock.calls[0][0]
      expect(txDetails).toMatchObject({
        routing: TradingApi.Routing.DUTCH_V2,
        chainId: mockValues.chainId as UniverseChainId,
        id: mockValues.orderId,
        from: mockValues.address,
        typeInfo: {
          type: TransactionType.Swap,
          inputCurrencyId: `${mockValues.chainId}-${mockValues.inputToken}`,
          outputCurrencyId: `${mockValues.chainId}-${mockValues.outputToken}`,
          inputCurrencyAmountRaw: '1000000',
          outputCurrencyAmountRaw: '500000000000000000',
          quoteId: 'quote123',
        },
        status: TransactionStatus.Pending,
        queueStatus: QueuedOrderStatus.Submitted,
        orderHash: mockValues.orderId,
        transactionOriginType: TransactionOriginType.External,
      })
      expect(typeof txDetails.addedTime).toBe('number')
      expect(Date.now() - txDetails.addedTime).toBeLessThan(1000)
    })

    it('should handle the case when no orders are returned', async () => {
      mockFetchLatestOpenOrder.mockResolvedValue({ orders: [] })
      await createExternallySubmittedUniswapXOrder(mockContext)(mockValues.address)

      expect(mockWaitForOrder).toHaveBeenCalled()
      expect(mockFetchLatestOpenOrder).toHaveBeenCalledWith(mockValues.address)
      expect(mockAddTxToWatcher).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API failure')
      mockFetchLatestOpenOrder.mockRejectedValue(mockError)

      await createExternallySubmittedUniswapXOrder(mockContext)(mockValues.address)

      expect(logger.error).toHaveBeenCalledWith(mockError, {
        tags: {
          file: 'handleExternallySubmittedUniswapXOrder',
          function: 'handleExternallySubmittedUniswapXOrder',
        },
      })
      expect(mockAddTxToWatcher).not.toHaveBeenCalled()
    })
  })
})
