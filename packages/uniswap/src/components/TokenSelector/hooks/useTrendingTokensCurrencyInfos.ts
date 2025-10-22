import { ALL_NETWORKS_ARG, CustomRankingType } from '@universe/api'
import { useMemo } from 'react'
import { tokenRankingsStatToCurrencyInfo, useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useTrendingTokensCurrencyInfos(
  chainFilter: Maybe<UniverseChainId>,
  skip?: boolean,
): {
  data: CurrencyInfo[] | undefined
  error: Error | undefined
  refetch: () => void
  loading: boolean
} {
  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery(
    {
      chainId: chainFilter?.toString() ?? ALL_NETWORKS_ARG,
    },
    !skip,
  )

  const trendingTokens = data?.tokenRankings[CustomRankingType.Trending]?.tokens
  const formattedTokens = useMemo(
    () => trendingTokens?.map(tokenRankingsStatToCurrencyInfo).filter((t): t is CurrencyInfo => Boolean(t)),
    [trendingTokens],
  )

  return { data: formattedTokens, loading: isLoading || isFetching, error: error ?? undefined, refetch }
}
