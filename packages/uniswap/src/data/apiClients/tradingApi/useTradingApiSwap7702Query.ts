import { queryOptions, useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { fetchCreateSwap7702 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { CreateSwap7702Request, CreateSwap7702Response } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type TradingApiQueryKey<Input> = readonly [typeof ReactQueryCacheKey.TradingApi, string, Input]

export const createSwap7702Query = (
  input: CreateSwap7702Request,
): UseQueryOptions<CreateSwap7702Response, Error, CreateSwap7702Response, TradingApiQueryKey<CreateSwap7702Request>> =>
  queryOptions({
    queryKey: [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.swap7702, input] as const,
    queryFn: () => fetchCreateSwap7702(input),
  })

export const useSwap7702Query = (input: CreateSwap7702Request): UseQueryResult<CreateSwap7702Response> => {
  const query = useMemo(() => createSwap7702Query(input), [input])
  return useQuery(query)
}
