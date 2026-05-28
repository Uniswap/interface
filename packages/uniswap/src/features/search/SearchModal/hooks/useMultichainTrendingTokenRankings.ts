import { ALL_NETWORKS_ARG, CustomRankingType, GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { tokenRankingsStatToSearchResult } from 'uniswap/src/data/rest/tokenRankingsMultichain'
import { MultichainSearchResult } from 'uniswap/src/features/dataApi/types'

/**
 * Fetches trending tokens from the TokenRankings API with multichain grouping.
 * Returns MultichainSearchResult[] for the search modal's no-query state.
 *
 * Temporary replacement for useSearchMultichainListTokens on the multichain flag path.
 */
export function useMultichainTrendingTokenRankings({
  pageSize,
  skip,
}: {
  pageSize: number
  skip: boolean
}): GqlResult<MultichainSearchResult[]> {
  const { data, isLoading, error, refetch } = useTokenRankingsQuery(
    { chainId: ALL_NETWORKS_ARG, multichain: true },
    !skip,
  )

  const results = useMemo(() => {
    const trendingTokens = data?.tokenRankings[CustomRankingType.Trending]?.tokens
    if (!trendingTokens) {
      return undefined
    }
    return trendingTokens
      .map(tokenRankingsStatToSearchResult)
      .filter((r): r is MultichainSearchResult => r !== undefined)
      .slice(0, pageSize)
  }, [data, pageSize])

  return useMemo(
    () => ({ data: results, loading: isLoading, error: error ?? undefined, refetch }),
    [results, isLoading, error, refetch],
  )
}
