import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { WithV4Flag, fetchSwap, fetchSwap5792 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
import {
  SwapData,
  convertSwap5792ResponseToSwapData,
  convertSwapResponseToSwapData,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTradingApiSwapQuery(
  { params, ...rest }: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<WithV4Flag<CreateSwapRequest>, SwapData>,
  config?: { canBatchTransactions?: boolean },
): UseQueryResult<SwapData> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.swap, params]
  const fetch = config?.canBatchTransactions ? fetch5792 : fetchLegacy

  return useQueryWithImmediateGarbageCollection<SwapData>({
    queryKey,
    queryFn: params ? (): Promise<SwapData> => fetch(params) : skipToken,
    ...rest,
  })
}

async function fetchLegacy(params: WithV4Flag<CreateSwapRequest>): Promise<SwapData> {
  return convertSwapResponseToSwapData(await fetchSwap(params))
}

async function fetch5792(params: WithV4Flag<CreateSwapRequest>): Promise<SwapData> {
  return convertSwap5792ResponseToSwapData(await fetchSwap5792(params))
}
