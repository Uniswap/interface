import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import { OnchainItemListOptionType, TokenOption } from 'uniswap/src/components/lists/items/types'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  sortPortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances/balances'

export function usePortfolioTokenOptions({
  addresses,
  chainFilter,
  searchFilter,
  includeHidden = false,
}: {
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  searchFilter?: string
  includeHidden?: boolean
}): GqlResult<TokenOption[] | undefined> & { hiddenTokens?: TokenOption[] } {
  const { data: portfolioBalancesById, error, refetch, loading } = usePortfolioBalancesForAddressById(addresses)
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
