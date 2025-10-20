import { GqlResult } from '@universe/api'
import { useCallback } from 'react'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useTrendingTokensCurrencyInfos } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensCurrencyInfos'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export function useTrendingTokensOptions({
  evmAddress,
  svmAddress,
  chainFilter,
}: {
  evmAddress: Address | undefined
  svmAddress: Address | undefined
  chainFilter: Maybe<UniverseChainId>
}): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPortfolioBalancesById,
  } = usePortfolioBalancesForAddressById({ evmAddress, svmAddress })

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
