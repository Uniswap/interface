import { queryOptions } from '@tanstack/react-query'
import type { TradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import type { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import type { IndicativeTrade, UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type IndicativeTradeServiceQueryOptions = QueryOptionsResult<
  IndicativeTrade | null,
  Error,
  IndicativeTrade | null,
  [ReactQueryCacheKey.TradeService, 'getIndicativeTrade', ValidatedTradeInput | null]
>

/**
 * Creates the queryOptions for handling indicative trades via a trade service
 * @param ctx - ctx containing the trade service
 * @returns The query options
 */
export function createIndicativeTradeServiceQueryOptions(ctx: {
  tradeService: TradeService
}): (params?: UseTradeArgs) => IndicativeTradeServiceQueryOptions {
  return (params?: UseTradeArgs) => {
    const validatedInput = ctx.tradeService.prepareIndicativeTradeInput(params)
    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradeService, 'getIndicativeTrade', validatedInput],
      queryFn: async (): Promise<IndicativeTrade | null> => {
        if (!params) {
          return null
        }
        return ctx.tradeService.getIndicativeTrade(params)
      },
      enabled: !!params && !params.skip && !!validatedInput,
    })
  }
}
