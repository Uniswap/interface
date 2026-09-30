import { UniverseChainId } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { top1DVolumeResultsToTokenOptions, useTop1DVolumeTokens } from 'uniswap/src/features/dataApi/top1DVolumeTokens'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

/**
 * Trending token options for both token selectors: top tokens by 1D volume merged with the user's
 * portfolio balances. Options carry market fields that TokenSelectorV2 rows render and legacy rows ignore.
 */
export function useTrendingTokensOptions({
  chainFilter,
  chainIds,
  portfolioData,
}: {
  chainFilter: Maybe<UniverseChainId>
  chainIds?: UniverseChainId[]
  portfolioData: PortfolioBalancesResult
}): DerivedQueryResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    isLoading: loadingPortfolioBalancesById,
  } = portfolioData

  const {
    data: results,
    error: tokensError,
    refetch: refetchTokens,
    isLoading: loadingTokens,
  } = useTop1DVolumeTokens({ chainFilter, chainIds })

  const tokenOptions = useMemo(
    () =>
      results ? top1DVolumeResultsToTokenOptions(results, { chainFilter, chainIds, portfolioBalancesById }) : undefined,
    [results, chainFilter, chainIds, portfolioBalancesById],
  )

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchTokens?.()
  }, [portfolioBalancesByIdRefetch, refetchTokens])

  const error = (!portfolioBalancesById && portfolioBalancesByIdError) || (!tokenOptions && tokensError) || null

  return {
    data: tokenOptions,
    refetch,
    error,
    isLoading: loadingPortfolioBalancesById || loadingTokens,
  }
}
