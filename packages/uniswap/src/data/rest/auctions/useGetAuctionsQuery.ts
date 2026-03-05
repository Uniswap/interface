import { keepPreviousData, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { getAuctions } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetAuctionsRequest, GetAuctionsResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const STALE_TIME = 60 * ONE_SECOND_MS

export function useGetAuctionsQuery<TSelectData = GetAuctionsResponse>({
  input,
  enabled = true,
  staleTime = STALE_TIME,
  refetchInterval = false,
  select,
}: {
  input?: GetAuctionsRequest
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  select?: (data: GetAuctionsResponse) => TSelectData
}): UseQueryResult<TSelectData, Error> {
  return useQuery<GetAuctionsResponse, Error, TSelectData>({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getAuctions, input] as const,
    queryFn: async () => getAuctions(input),
    enabled,
    staleTime,
    refetchInterval,
    placeholderData: keepPreviousData,
    select,
  })
}
