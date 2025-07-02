import type { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { Routing, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import {
  createQuoteRepository,
  type QuoteRepository,
} from 'uniswap/src/features/transactions/swap/services/tradeService/quoteRepository'
import type { Logger } from 'utilities/src/logger/logger'

// Mock dependencies
jest.mock('uniswap/src/features/transactions/swap/analytics')

describe('QuoteRepository', () => {
  // Minimal test params
  const mockParams = {
    tokenInChainId: 1,
    tokenOutChainId: 1,
    type: TradeType.EXACT_INPUT,
    amount: '1000000',
    tokenIn: '0x1234',
    tokenOut: '0x5678',
    swapper: '0xabcd',
    v4Enabled: false,
  }

  // Minimal mock result
  const mockResult = {
    quote: {},
    routing: Routing.CLASSIC,
    requestId: '123',
  }

  // Setup mocks
  const mockFetchQuote = jest.fn().mockResolvedValue(mockResult as DiscriminatedQuoteResponse)
  const mockGetIsUSDQuote = jest.fn().mockReturnValue(false)
  const mockLogger = { info: jest.fn() } as Partial<Logger> as Logger

  // Helper for repository creation
  const createTestRepo = (options = {}): QuoteRepository =>
    createQuoteRepository({
      fetchQuote: mockFetchQuote,
      getIsUSDQuote: mockGetIsUSDQuote,
      ...options,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchQuote', () => {
    it('calls the underlying fetchQuote with the same parameters', async () => {
      const repository = createTestRepo()
      await repository.fetchQuote(mockParams)
      expect(mockFetchQuote).toHaveBeenCalledWith(mockParams)
    })

    it('returns the result from the underlying fetchQuote', async () => {
      const repository = createTestRepo()
      const result = await repository.fetchQuote(mockParams)
      expect(result).toBe(mockResult)
    })

    describe('analytics', () => {
      it('logs swap quote fetch with chainId and isUSDQuote', async () => {
        const repository = createTestRepo()
        await repository.fetchQuote(mockParams)
        expect(logSwapQuoteFetch).toHaveBeenCalledWith({ chainId: mockParams.tokenInChainId, isUSDQuote: false })
      })
    })

    describe('latency logging', () => {
      beforeEach(() => jest.clearAllMocks())

      test.each([
        ['USD quote', true, false],
        ['no logger provided', false, false],
      ])(
        'does not log latency when %s',
        // eslint-disable-next-line max-params
        async (_, isUSDQuote, includeLogger) => {
          mockGetIsUSDQuote.mockReturnValueOnce(isUSDQuote)

          const repository = createTestRepo(includeLogger ? { logger: mockLogger } : {})
          await repository.fetchQuote(mockParams)

          expect(mockLogger.info).not.toHaveBeenCalled()
          expect(mockFetchQuote).toHaveBeenCalledTimes(1)
        },
      )

      it('logs latency with all required fields when conditions are met', async () => {
        // Create a spy on Date.now that returns controlled values
        const dateSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValueOnce(100) // First call - start time
          .mockReturnValueOnce(300) // Second call - end time (200ms later)

        const repository = createTestRepo({ logger: mockLogger })
        await repository.fetchQuote(mockParams)

        expect(mockLogger.info).toHaveBeenCalledWith('useTrade', 'useTrade', 'Quote Latency', {
          quoteLatency: 200,
          chainIdIn: mockParams.tokenInChainId,
          chainIdOut: mockParams.tokenOutChainId,
          isBridging: false,
        })

        // Restore the original implementation
        dateSpy.mockRestore()
      })
    })

    describe('error handling', () => {
      it('propagates errors from the underlying fetchQuote', async () => {
        const expectedError = new Error('Failed to fetch quote')
        mockFetchQuote.mockRejectedValueOnce(expectedError)

        const repository = createTestRepo()
        await expect(repository.fetchQuote(mockParams)).rejects.toThrow(expectedError)
      })
    })
  })
})
