import { GqlResult } from '@universe/api'
import { useCallback } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function useTrendingTokensOptions({
  chainFilter,
  portfolioData,
}: {
  chainFilter: Maybe<UniverseChainId>
  portfolioData: PortfolioBalancesResult
}): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPortfolioBalancesById,
  } = portfolioData

  const {
    data: tokens,
    error: tokensError,
    refetch: refetchTokens,
    loading: loadingTokens,
  } = useTrendingTokensCurrencyInfos(chainFilter)

  const tokenOptions = useCurrencyInfosToTokenOptions({ currencyInfos: tokens, portfolioBalancesById })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchTokens()
  }, [portfolioBalancesByIdRefetch, refetchTokens])

  const error =
    (!portfolioBalancesById ? portfolioBalancesByIdError : undefined) || (!tokenOptions ? tokensError : undefined)

  return {
    data: tokenOptions,
    refetch,
    error,
    loading: loadingPortfolioBalancesById || loadingTokens,
  }
}
