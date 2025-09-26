import { skipToken, type UseQueryResult } from '@tanstack/react-query'
import {
  type TradingApi,
  type UseQueryWithImmediateGarbageCollectionApiHelperHookArgs,
  useQueryWithImmediateGarbageCollection,
} from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  convertSwap5792ResponseToSwapData,
  convertSwap7702ResponseToSwapData,
  convertSwapResponseToSwapData,
  type SwapData,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTradingApiSwapQuery(
  { params, ...rest }: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<TradingApi.CreateSwapRequest, SwapData>,
  config?: { canBatchTransactions?: boolean; swapDelegationAddress?: string; includesDelegation?: boolean },
): UseQueryResult<SwapData> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.swap, params]
  const fetch = getFetchFn(config)

  return useQueryWithImmediateGarbageCollection<SwapData>({
    queryKey,
    queryFn: params ? (): Promise<SwapData> => fetch(params) : skipToken,
    ...rest,
  })
}

function getFetchFn(config?: {
  canBatchTransactions?: boolean
  swapDelegationAddress?: string
  includesDelegation?: boolean
}): (params: TradingApi.CreateSwapRequest) => Promise<SwapData> {
  const { canBatchTransactions, swapDelegationAddress, includesDelegation } = config ?? {}
  if (swapDelegationAddress) {
    return (params) => fetch7702({ swapDelegationAddress, params, includesDelegation })
  }

  if (canBatchTransactions) {
    return fetch5792
  }

  return fetchLegacy
}

async function fetch7702({
  swapDelegationAddress,
  params,
  includesDelegation,
}: {
  swapDelegationAddress: string
  params: TradingApi.CreateSwapRequest
  includesDelegation?: boolean
}): Promise<SwapData> {
  return convertSwap7702ResponseToSwapData(
    await TradingApiClient.fetchSwap7702({ ...params, smartContractDelegationAddress: swapDelegationAddress }),
    includesDelegation,
  )
}

async function fetchLegacy(params: TradingApi.CreateSwapRequest): Promise<SwapData> {
  return convertSwapResponseToSwapData(await TradingApiClient.fetchSwap(params))
}

async function fetch5792(params: TradingApi.CreateSwapRequest): Promise<SwapData> {
  return convertSwap5792ResponseToSwapData(await TradingApiClient.fetchSwap5792(params))
}
