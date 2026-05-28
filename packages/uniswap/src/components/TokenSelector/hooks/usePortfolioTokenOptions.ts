import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenBalancesGroupedByVisibility } from 'uniswap/src/features/portfolio/balances/hooks'
import { sortPortfolioBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'

export function usePortfolioTokenOptions({
  chainFilter,
  searchFilter,
  includeHidden = false,
  portfolioData,
}: {
  chainFilter: UniverseChainId | null
  searchFilter?: string
  includeHidden?: boolean
  portfolioData: PortfolioBalancesResult
}): GqlResult<TokenOption[] | undefined> & { hiddenTokens?: TokenOption[] } {
  const { data: portfolioBalancesById, error, refetch, loading } = portfolioData
  const { isTestnetModeEnabled } = useEnabledChains()

  const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({
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

  const hiddenPortfolioBalances: TokenOption[] | undefined = useMemo(
    () =>
      includeHidden && hiddenTokens
        ? sortPortfolioBalances({ balances: hiddenTokens, isTestnetModeEnabled }).map((balance) => ({
            ...balance,
            type: OnchainItemListOptionType.Token,
          }))
        : undefined,
    [hiddenTokens, includeHidden, isTestnetModeEnabled],
  )

  const filteredPortfolioBalances = useMemo(
    () => portfolioBalances && filter({ tokenOptions: portfolioBalances, chainFilter, searchFilter, hideWSOL: true }),
    [chainFilter, portfolioBalances, searchFilter],
  )

  const filteredHiddenPortfolioBalances = useMemo(
    () =>
      includeHidden && hiddenPortfolioBalances
        ? filter({ tokenOptions: hiddenPortfolioBalances, chainFilter, searchFilter, hideWSOL: true })
        : undefined,
    [chainFilter, hiddenPortfolioBalances, includeHidden, searchFilter],
  )

  return {
    data: filteredPortfolioBalances,
    hiddenTokens: filteredHiddenPortfolioBalances,
    error,
    refetch,
    loading,
  }
}
