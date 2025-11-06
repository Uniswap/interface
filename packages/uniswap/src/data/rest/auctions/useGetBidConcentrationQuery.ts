import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { getBidConcentration } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetBidConcentrationRequest, GetBidConcentrationResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const STALE_TIME = 30 * ONE_SECOND_MS

export function useGetBidConcentrationQuery<TSelectData = GetBidConcentrationResponse>({
  input,
  enabled = true,
  staleTime = STALE_TIME,
  refetchInterval = false,
  select,
}: {
  input: GetBidConcentrationRequest
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  select?: (data: GetBidConcentrationResponse) => TSelectData
}): UseQueryResult<TSelectData, Error> {
  return useQuery<GetBidConcentrationResponse, Error, TSelectData>({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getBidConcentration, input] as const,
    queryFn: async () => getBidConcentration(input),
    enabled,
    staleTime,
    refetchInterval,
    select,
  })
}
