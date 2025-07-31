import { queryOptions, type UseQueryOptions } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { QuoteRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { TradeRepository } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import { QuoteWithTradeAndGasEstimate } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/transformQuoteToTrade'
import { type Logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type QueryFnData = DiscriminatedQuoteResponse | null

export type TradingApiQuoteQueryOptions = UseQueryOptions<
  QueryFnData,
  Error,
  QuoteWithTradeAndGasEstimate,
  [ReactQueryCacheKey.TradingApi, string, (QuoteRequest & { isUSDQuote?: boolean }) | undefined]
>

export type GetTradingApiQuoteQueryOptions = (params?: QuoteRequest) => TradingApiQuoteQueryOptions

export function createGetTradingApiQuoteQueryOptions(ctx: {
  select: (data: DiscriminatedQuoteResponse | null) => QuoteWithTradeAndGasEstimate
  tradeRepository: TradeRepository
  logger?: Logger
}): GetTradingApiQuoteQueryOptions {
  const getTradingApiQuoteQueryOptions = (params?: QuoteRequest): TradingApiQuoteQueryOptions => {
    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.quote, params],
      queryFn: async (): Promise<DiscriminatedQuoteResponse | null> => {
        if (!params) {
          return null
        }
        return ctx.tradeRepository.fetchQuote(params)
      },
      enabled: !!params,
      select: ctx.select,
    })
  }

  return getTradingApiQuoteQueryOptions
}
