import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { getAuctionDetails } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetAuctionDetailsRequest, GetAuctionDetailsResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

const STALE_TIME = 5 * 60 * ONE_SECOND_MS

export function useGetAuctionDetailsQuery<TSelectData = GetAuctionDetailsResponse>({
  input,
  enabled = true,
  staleTime = STALE_TIME,
  gcTime = MAX_REACT_QUERY_CACHE_TIME_MS,
  select,
}: {
  input: GetAuctionDetailsRequest
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  select?: (data: GetAuctionDetailsResponse) => TSelectData
}): UseQueryResult<TSelectData, Error> {
  return useQuery<GetAuctionDetailsResponse, Error, TSelectData>({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getAuctionDetails, input] as const,
    queryFn: async () => getAuctionDetails(input),
    enabled,
    staleTime,
    gcTime,
    select,
  })
}
