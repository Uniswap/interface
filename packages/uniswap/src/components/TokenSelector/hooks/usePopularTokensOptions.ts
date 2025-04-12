import { useCallback } from 'react'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePopularTokensGql } from 'uniswap/src/features/dataApi/topTokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// TODO(WEB-5917): Rename to useTrendingTokensOptions once feature flag is fully on
export function usePopularTokensOptions(
  address: Address | undefined,
  chainFilter: Maybe<UniverseChainId>,
): GqlResult<TokenOption[] | undefined> {
  const isTokenSelectorTrendingTokensEnabled = useFeatureFlag(FeatureFlags.TokenSelectorTrendingTokens)
  const { defaultChainId } = useEnabledChains()

  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: trendingTokensRest,
    error: trendingTokensRestError,
    refetch: refetchTrendingTokensRest,
    loading: loadingTrendingTokensRest,
  } = useTrendingTokensCurrencyInfos(chainFilter)

  const {
    data: popularTokensGql,
    error: popularTokensGqlError,
    refetch: refetchPopularTokensGql,
    loading: loadingPopularTokensGql,
    // if there is no chain filter then we show default chain tokens
  } = usePopularTokensGql(chainFilter ?? defaultChainId, isTokenSelectorTrendingTokensEnabled)

  const tokens = isTokenSelectorTrendingTokensEnabled ? trendingTokensRest : popularTokensGql
  const tokensError = isTokenSelectorTrendingTokensEnabled ? trendingTokensRestError : popularTokensGqlError
  const refetchTokens = isTokenSelectorTrendingTokensEnabled ? refetchTrendingTokensRest : refetchPopularTokensGql
  const loadingTokens = isTokenSelectorTrendingTokensEnabled ? loadingTrendingTokensRest : loadingPopularTokensGql

  const tokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: tokens,
    portfolioBalancesById,
    sortAlphabetically: !isTokenSelectorTrendingTokensEnabled,
  })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchTokens?.()
  }, [portfolioBalancesByIdRefetch, refetchTokens])

  const error = (!portfolioBalancesById && portfolioBalancesByIdError) || (!tokenOptions && tokensError)

  return {
    data: tokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingTokens,
  }
}
