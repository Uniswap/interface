import { queryOptions, UseQueryOptions } from '@tanstack/react-query'
import type { JupiterOrderUrlParams } from '@universe/api/src/clients/jupiter/types'
import type {
  TradeService,
  TradeWithGasEstimates,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type TradeServiceQueryOptions = UseQueryOptions<
  TradeWithGasEstimates,
  Error,
  TradeWithGasEstimates,
  [
    ReactQueryCacheKey.TradeService,
    'getTrade',
    ValidatedTradeInput | JupiterOrderUrlParams | null, // TODO(SWAP-383): Remove JupiterOrderUrlParams from union once Solana trade repo is implemented
  ]
>

export function createTradeServiceQueryOptions(ctx: {
  tradeService: TradeService
}): (params?: UseTradeArgs) => TradeServiceQueryOptions {
  return (params?: UseTradeArgs) => {
    const validatedInput = params ? ctx.tradeService.prepareTradeInput(params) : null

    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradeService, 'getTrade', validatedInput],
      queryFn: async (): Promise<TradeWithGasEstimates> => {
        if (!params) {
          return { trade: null }
        }
        return ctx.tradeService.getTrade(params)
      },
      enabled: !!params && !params.skip && !!validatedInput,
    })
  }
}
