import { useMemo } from 'react'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { tokenRankingsStatToCurrencyInfo, useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { CustomRankingType } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useTrendingTokensCurrencyInfos(chainFilter: Maybe<UniverseChainId>): {
  data: CurrencyInfo[]
  error: Error | undefined
  refetch: () => void
  loading: boolean
} {
  const isTokenSelectorTrendingTokensEnabled = useFeatureFlag(FeatureFlags.TokenSelectorTrendingTokens)

  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery(
    {
      chainId: chainFilter?.toString() ?? ALL_NETWORKS_ARG,
    },
    isTokenSelectorTrendingTokensEnabled,
  )

  const trendingTokens = data?.tokenRankings?.[CustomRankingType.Trending]?.tokens
  const formattedTokens = useMemo(
    () => trendingTokens?.map(tokenRankingsStatToCurrencyInfo).filter((t): t is CurrencyInfo => Boolean(t)) ?? [],
    [trendingTokens],
  )

  return { data: formattedTokens, loading: isLoading || isFetching, error: error ?? undefined, refetch }
}
