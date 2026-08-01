import { queryOptions, UseQueryOptions } from '@tanstack/react-query'
import type { JupiterOrderUrlParams } from '@universe/api'
import type {
  TradeService,
  TradeWithGasEstimates,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

// Settings that affect the quote response but are read inside the queryFn rather than
// being part of ValidatedTradeInput. They must participate in the cache key so React Query
// refetches immediately when the user changes them, instead of waiting for the next poll.
type TradeQuoteSettings = {
  customSlippageTolerance: number | undefined
  selectedProtocols: FrontendSupportedProtocol[] | undefined
  isV4HookPoolsEnabled: boolean | undefined
}

export type TradeServiceQueryOptions = UseQueryOptions<
  TradeWithGasEstimates,
  Error,
  TradeWithGasEstimates,
  [
    ReactQueryCacheKey.TradeService,
    'getTrade',
    ValidatedTradeInput | JupiterOrderUrlParams | null, // TODO(SWAP-383): Remove JupiterOrderUrlParams from union once Solana trade repo is implemented
    TradeQuoteSettings,
  ]
>

export function createTradeServiceQueryOptions(ctx: {
  tradeService: TradeService
}): (params?: UseTradeArgs) => TradeServiceQueryOptions {
  return (params?: UseTradeArgs) => {
    const validatedInput = params ? ctx.tradeService.prepareTradeInput(params) : null

    const settings: TradeQuoteSettings = {
      customSlippageTolerance: params?.customSlippageTolerance,
      selectedProtocols: params?.selectedProtocols,
      isV4HookPoolsEnabled: params?.isV4HookPoolsEnabled,
    }

    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradeService, 'getTrade', validatedInput, settings],
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
