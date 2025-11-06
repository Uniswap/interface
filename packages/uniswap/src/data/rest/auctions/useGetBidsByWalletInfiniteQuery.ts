import { InfiniteData, type UseInfiniteQueryResult, useInfiniteQuery } from '@tanstack/react-query'
import { getBidsByWallet } from 'uniswap/src/data/rest/auctions/auctionService'
import { AUCTION_API_PATHS } from 'uniswap/src/data/rest/auctions/paths'
import type { GetBidsByWalletRequest, GetBidsByWalletResponse } from 'uniswap/src/data/rest/auctions/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useGetBidsByWalletInfiniteQuery({
  input,
  enabled = true,
  staleTime,
  refetchInterval = false,
}: {
  input: Omit<GetBidsByWalletRequest, 'page_token'>
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
}): UseInfiniteQueryResult<InfiniteData<GetBidsByWalletResponse>, Error> {
  return useInfiniteQuery<
    GetBidsByWalletResponse,
    Error,
    InfiniteData<GetBidsByWalletResponse>,
    readonly [ReactQueryCacheKey.AuctionApi, string, Omit<GetBidsByWalletRequest, 'page_token'>, 'infinite']
  >({
    queryKey: [ReactQueryCacheKey.AuctionApi, AUCTION_API_PATHS.getBidsByWallet, input, 'infinite'] as const,
    queryFn: async ({ pageParam }): Promise<GetBidsByWalletResponse> => {
      const pageToken = typeof pageParam === 'string' ? pageParam : undefined
      return await getBidsByWallet(pageToken ? { ...input, page_token: pageToken } : input)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage): string | undefined => lastPage.next_page_token || undefined,
    enabled,
    staleTime,
    refetchInterval,
  })
}
