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
    string, // Stable query key based on values instead of object reference
  ]
>

/**
 * Creates a stable query key based on validated input values instead of object reference.
 * This prevents unnecessary refetches when object references change but values remain the same.
 */
function createStableQueryKey(
  validatedInput: ValidatedTradeInput | JupiterOrderUrlParams | null,
): string {
  if (!validatedInput) {
    return 'null'
  }

  // Handle JupiterOrderUrlParams (Solana trades)
  if ('inputMint' in validatedInput && 'outputMint' in validatedInput) {
    const jupiterParams = validatedInput as JupiterOrderUrlParams
    const keyParts = [
      'jupiter',
      jupiterParams.inputMint,
      jupiterParams.outputMint,
      jupiterParams.amount,
      jupiterParams.swapMode,
      jupiterParams.slippageBps ?? 'default',
    ]
    return keyParts.join('|')
  }

  // Handle ValidatedTradeInput (EVM trades)
  const evmInput = validatedInput as ValidatedTradeInput
  // Create a stable key based on all relevant values
  // This ensures the query key only changes when actual values change, not object references
  const keyParts = [
    evmInput.tokenInChainId,
    evmInput.tokenInAddress,
    evmInput.tokenOutChainId,
    evmInput.tokenOutAddress,
    evmInput.amount.quotient.toString(),
    evmInput.requestTradeType,
    evmInput.activeAccountAddress ?? 'unconnected',
    evmInput.isUSDQuote ?? false,
    evmInput.generatePermitAsTransaction ?? false,
  ]

  return keyParts.join('|')
}

export function createTradeServiceQueryOptions(ctx: {
  tradeService: TradeService
}): (params?: UseTradeArgs) => TradeServiceQueryOptions {
  return (params?: UseTradeArgs) => {
    const validatedInput = params ? ctx.tradeService.prepareTradeInput(params) : null
    const stableKey = createStableQueryKey(validatedInput)

    return queryOptions({
      queryKey: [ReactQueryCacheKey.TradeService, 'getTrade', stableKey],
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
