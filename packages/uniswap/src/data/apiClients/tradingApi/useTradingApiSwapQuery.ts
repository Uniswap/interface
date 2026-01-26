import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  type TradingApi,
  type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import type { SwapData } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * HashKey chains (133, 177) do not use swap API.
 * This hook should never be called for HashKey chains.
 * Transactions are built directly from quote methodParameters.
 */
export function useTradingApiSwapQuery(
  { params, ...rest }: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<TradingApi.CreateSwapRequest, SwapData>,
  config?: { canBatchTransactions?: boolean; swapDelegationAddress?: string; includesDelegation?: boolean },
): UseQueryResult<SwapData> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.swap, params]

  return useQueryWithImmediateGarbageCollection<SwapData>({
    queryKey,
    queryFn: params
      ? (): Promise<SwapData> => {
          throw new Error(
            'Swap API is not used for HashKey chains. Transactions should be built from quote methodParameters.',
          )
        }
      : skipToken,
    ...rest,
  })
}
