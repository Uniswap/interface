import { skipToken, UseQueryResult } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { fetchSwap, fetchSwap5792, fetchSwap7702 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { CreateSwapRequest } from 'uniswap/src/data/tradingApi/__generated__'
import {
  convertSwap5792ResponseToSwapData,
  convertSwap7702ResponseToSwapData,
  convertSwapResponseToSwapData,
  SwapData,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/evm/evmSwapRepository'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useTradingApiSwapQuery(
  { params, ...rest }: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<CreateSwapRequest, SwapData>,
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
}): (params: CreateSwapRequest) => Promise<SwapData> {
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
  params: CreateSwapRequest
  includesDelegation?: boolean
}): Promise<SwapData> {
  return convertSwap7702ResponseToSwapData(
    await fetchSwap7702({ ...params, smartContractDelegationAddress: swapDelegationAddress }),
    includesDelegation,
  )
}

async function fetchLegacy(params: CreateSwapRequest): Promise<SwapData> {
  return convertSwapResponseToSwapData(await fetchSwap(params))
}

async function fetch5792(params: CreateSwapRequest): Promise<SwapData> {
  return convertSwap5792ResponseToSwapData(await fetchSwap5792(params))
}
