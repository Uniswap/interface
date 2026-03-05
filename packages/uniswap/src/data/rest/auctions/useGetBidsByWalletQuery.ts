import { keepPreviousData, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { getBidsByWallet } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetBidsByWalletRequest, GetBidsByWalletResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const STALE_TIME = 30 * ONE_SECOND_MS

export function useGetBidsByWalletQuery<TSelectData = GetBidsByWalletResponse>({
  input,
  enabled = true,
  staleTime = STALE_TIME,
  refetchInterval = false,
  select,
}: {
  input: GetBidsByWalletRequest
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
  select?: (data: GetBidsByWalletResponse) => TSelectData
}): UseQueryResult<TSelectData, Error> {
  return useQuery<GetBidsByWalletResponse, Error, TSelectData>({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getBidsByWallet, input] as const,
    queryFn: async () => getBidsByWallet(input),
    enabled,
    staleTime,
    refetchInterval,
    placeholderData: keepPreviousData,
    select,
  })
}
