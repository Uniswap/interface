import { DiscriminatedQuoteResponse, type FetchQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { type Logger } from 'utilities/src/logger/logger'

export interface QuoteRepository {
  fetchQuote: FetchQuote
}

export function createQuoteRepository(ctx: {
  getIsUSDQuote: () => boolean
  fetchQuote: FetchQuote
  logger?: Logger
}): QuoteRepository {
  return {
    fetchQuote: async (params): Promise<DiscriminatedQuoteResponse> => {
      const isUSDQuote = ctx.getIsUSDQuote()

      logSwapQuoteFetch({ chainId: params.tokenInChainId, isUSDQuote })

      // Skip latency logging for USD quotes
      const startTime = ctx.logger && !isUSDQuote ? Date.now() : undefined

      const result = await ctx.fetchQuote(params)

      // Log latency when not a USD quote
      if (startTime && ctx.logger) {
        // keep the log name details the same for historical reasons
        ctx.logger.info('useTrade', 'useTrade', 'Quote Latency', {
          quoteLatency: Date.now() - startTime,
          chainIdIn: params.tokenInChainId,
          chainIdOut: params.tokenOutChainId,
          isBridging: isBridging(params.tokenInChainId, params.tokenOutChainId),
        })
      }

      return result
    },
  }
}

function isBridging(tokenInChainId?: number, tokenOutChainId?: number): boolean {
  return Boolean(tokenInChainId && tokenOutChainId && tokenInChainId !== tokenOutChainId)
}
