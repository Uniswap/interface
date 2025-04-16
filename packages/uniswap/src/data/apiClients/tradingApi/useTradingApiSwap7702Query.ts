import { queryOptions, useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query'
import { useMemo } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { fetchCreateSwap7702, TRADING_API_CACHE_KEY } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import type { CreateSwap7702Request, CreateSwap7702Response } from 'uniswap/src/data/tradingApi/__generated__'

type TradingApiQueryKey<Input> = readonly [typeof TRADING_API_CACHE_KEY, string, Input]

export const createSwap7702Query = (
  input: CreateSwap7702Request,
): UseQueryOptions<CreateSwap7702Response, Error, CreateSwap7702Response, TradingApiQueryKey<CreateSwap7702Request>> =>
  queryOptions({
    queryKey: [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.swap7702, input] as const,
    queryFn: () => fetchCreateSwap7702(input),
  })

export const useSwap7702Query = (input: CreateSwap7702Request): UseQueryResult<CreateSwap7702Response> => {
  const query = useMemo(() => createSwap7702Query(input), [input])
  return useQuery(query)
}
