import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useTokenBalancesGroupedByVisibility } from 'uniswap/src/features/portfolio/balances/hooks'
import { sortPortfolioBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

export function usePortfolioTokenOptions({
  chainFilter,
  chainIds,
  searchFilter,
  includeHidden = false,
  portfolioData,
}: {
  chainFilter: UniverseChainId | null
  chainIds?: UniverseChainId[]
  searchFilter?: string
  includeHidden?: boolean
  portfolioData: PortfolioBalancesResult
}): DerivedQueryResult<TokenOption[] | undefined> & { hiddenTokens?: TokenOption[] } {
  const { data: portfolioBalancesById, error, refetch, isLoading } = portfolioData
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
    () =>
      portfolioBalances &&
      filter({ tokenOptions: portfolioBalances, chainFilter, chainIds, searchFilter, hideWSOL: true }),
    [chainFilter, chainIds, portfolioBalances, searchFilter],
  )

  const filteredHiddenPortfolioBalances = useMemo(
    () =>
      includeHidden && hiddenPortfolioBalances
        ? filter({ tokenOptions: hiddenPortfolioBalances, chainFilter, chainIds, searchFilter, hideWSOL: true })
        : undefined,
    [chainFilter, chainIds, hiddenPortfolioBalances, includeHidden, searchFilter],
  )

  return {
    data: filteredPortfolioBalances,
    hiddenTokens: filteredHiddenPortfolioBalances,
    error,
    refetch,
    isLoading,
  }
}
