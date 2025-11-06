import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { getLatestCheckpoint } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetLatestCheckpointRequest, GetLatestCheckpointResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const STALE_TIME = 2 * ONE_SECOND_MS

export function useGetLatestCheckpointQuery<TSelectData = GetLatestCheckpointResponse>({
  input,
  enabled = true,
  staleTime = STALE_TIME,
  refetchInterval = false,
  select,
}: {
  input: GetLatestCheckpointRequest
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  select?: (data: GetLatestCheckpointResponse) => TSelectData
}): UseQueryResult<TSelectData, Error> {
  return useQuery<GetLatestCheckpointResponse, Error, TSelectData>({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getLatestCheckpoint, input] as const,
    queryFn: async () => getLatestCheckpoint(input),
    enabled,
    staleTime,
    refetchInterval,
    select,
  })
}
