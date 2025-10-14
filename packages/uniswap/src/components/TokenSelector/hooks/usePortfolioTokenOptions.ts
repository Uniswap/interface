import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  sortPortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances/balances'

export function usePortfolioTokenOptions({
  evmAddress,
  svmAddress,
  chainFilter,
  searchFilter,
}: {
  evmAddress: Address | undefined
  svmAddress: Address | undefined
  chainFilter: UniverseChainId | null
  searchFilter?: string
}): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalancesForAddressById({ evmAddress, svmAddress })
  const { isTestnetModeEnabled } = useEnabledChains()

  const { shownTokens } = useTokenBalancesGroupedByVisibility({
    balancesById: portfolioBalancesById,
  })

  const portfolioBalances: TokenOption[] | undefined = useMemo(
    () =>
      shownTokens
        ? sortPortfolioBalances({ balances: shownTokens, isTestnetModeEnabled }).map((balance) => ({
            ...balance,
            type: OnchainItemListOptionType.Token,
          }))
        : undefined,
    [shownTokens, isTestnetModeEnabled],
  )

  const filteredPortfolioBalances = useMemo(
    () => portfolioBalances && filter({ tokenOptions: portfolioBalances, chainFilter, searchFilter, hideWSOL: true }),
    [chainFilter, portfolioBalances, searchFilter],
  )

  return {
    data: filteredPortfolioBalances,
    error,
    refetch,
    loading,
  }
}
