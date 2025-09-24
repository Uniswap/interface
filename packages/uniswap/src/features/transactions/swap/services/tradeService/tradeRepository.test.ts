import type { DiscriminatedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import {
  createTradeRepository,
  type TradeRepository,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import type { Logger } from 'utilities/src/logger/logger'

// Mock dependencies
jest.mock('uniswap/src/features/transactions/swap/analytics')

describe('TradeRepository', () => {
  // Minimal test params
  const mockParams = {
    tokenInChainId: 1,
    tokenOutChainId: 1,
    type: TradingApi.TradeType.EXACT_INPUT,
    amount: '1000000',
    tokenIn: '0x1234',
    tokenOut: '0x5678',
    swapper: '0xabcd',
    v4Enabled: false,
  }

  // Minimal mock result
  const mockResult = {
    quote: {},
    routing: TradingApi.Routing.CLASSIC,
    requestId: '123',
  }

  // Setup mocks
  const mockFetchQuote = jest.fn().mockResolvedValue(mockResult as DiscriminatedQuoteResponse)
  const mockFetchIndicativeQuote = jest.fn().mockResolvedValue(mockResult as DiscriminatedQuoteResponse)
  const mockLogger = { info: jest.fn(), error: jest.fn() } as Partial<Logger> as Logger

  // Helper for repository creation
  const createTestRepo = (options = {}): TradeRepository =>
    createTradeRepository({
      fetchQuote: mockFetchQuote,
      fetchIndicativeQuote: mockFetchIndicativeQuote,
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
        expect(logSwapQuoteFetch).toHaveBeenCalledWith({ chainId: mockParams.tokenInChainId, isUSDQuote: undefined })
      })

      it('logs swap quote fetch with isUSDQuote=true when specified', async () => {
        const repository = createTestRepo()
        await repository.fetchQuote({ ...mockParams, isUSDQuote: true })
        expect(logSwapQuoteFetch).toHaveBeenCalledWith({ chainId: mockParams.tokenInChainId, isUSDQuote: true })
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
          const repository = createTestRepo(includeLogger ? { logger: mockLogger } : {})
          await repository.fetchQuote({ ...mockParams, isUSDQuote })

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

      it('logs latency with isBridging=true when chain IDs differ', async () => {
        const bridgingParams = { ...mockParams, tokenOutChainId: 10 }
        const repository = createTestRepo({ logger: mockLogger })
        await repository.fetchQuote(bridgingParams)

        expect(mockLogger.info).toHaveBeenCalledWith(
          'useTrade',
          'useTrade',
          'Quote Latency',
          expect.objectContaining({
            isBridging: true,
          }),
        )
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

  describe('fetchIndicativeQuote', () => {
    const indicativeParams = {
      type: TradingApi.TradeType.EXACT_INPUT,
      amount: '1000000',
      tokenInChainId: 1,
      tokenOutChainId: 1,
      tokenIn: '0x1234',
      tokenOut: '0x5678',
      swapper: '0xabcd',
    }

    it('calls the underlying fetchIndicativeQuote with the same parameters', async () => {
      const repository = createTestRepo()
      await repository.fetchIndicativeQuote(indicativeParams)
      expect(mockFetchIndicativeQuote).toHaveBeenCalledWith(indicativeParams)
    })

    it('returns the result from the underlying fetchIndicativeQuote', async () => {
      const repository = createTestRepo()
      const result = await repository.fetchIndicativeQuote(indicativeParams)
      expect(result).toBe(mockResult)
    })

    it('logs swap quote fetch with isQuickRoute: true', async () => {
      const repository = createTestRepo()
      await repository.fetchIndicativeQuote(indicativeParams)
      expect(logSwapQuoteFetch).toHaveBeenCalledWith({
        chainId: indicativeParams.tokenInChainId,
        isQuickRoute: true,
      })
    })

    it('logs indicative quote latency when logger is provided', async () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(300)

      const repository = createTestRepo({ logger: mockLogger })
      await repository.fetchIndicativeQuote(indicativeParams)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'tradeRepository',
        'fetchIndicativeQuote',
        'Indicative Quote Latency',
        {
          quoteLatency: 200,
          chainIdIn: indicativeParams.tokenInChainId,
          chainIdOut: indicativeParams.tokenOutChainId,
          isBridging: false,
        },
      )

      dateSpy.mockRestore()
    })

    it('propagates errors from the underlying fetchIndicativeQuote', async () => {
      const expectedError = new Error('Failed to fetch indicative quote')
      mockFetchIndicativeQuote.mockRejectedValueOnce(expectedError)

      const repository = createTestRepo()
      await expect(repository.fetchIndicativeQuote(indicativeParams)).rejects.toThrow(expectedError)
    })
  })
})
