import { useCallback, useMemo } from 'react'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useTokenSectionsForSearchResults({
  address,
  chainFilter,
  searchFilter,
  isBalancesOnlySearch,
}: {
  address?: string
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  isBalancesOnlySearch: boolean
}): GqlResult<OnchainItemSection<TokenOption>[]> {
  const { refetch: refetchPortfolioBalances } = usePortfolioBalancesForAddressById(address) // Bypass this

  const { refetch: refetchPortfolioTokenOptions } = usePortfolioTokenOptions({
    address,
    chainFilter,
    searchFilter: searchFilter ?? undefined,
  }) // Bypass this

  // Only call search endpoint if isBalancesOnlySearch is false
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: isBalancesOnlySearch,
  })

  const [selectedNetworkResults] = useMemo((): [CurrencyInfo[]] => {
    if (!searchResultCurrencies) {
      return [[]]
    }

    const selected = searchResultCurrencies.filter((currency) => !currency.isFromOtherNetwork)

    return [selected]
  }, [searchResultCurrencies])

  const searchResults = useCurrencyInfosToTokenOptions({
    currencyInfos: selectedNetworkResults,
  })

  const loading = !isBalancesOnlySearch && searchTokensLoading

  const searchResultsSections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SearchResults,
    // Use local search when only searching balances
    options: searchResults,
  })

  const error = !isBalancesOnlySearch && !searchResults && searchTokensError

  const refetchAll = useCallback(() => {
    refetchPortfolioBalances?.()
    refetchSearchTokens?.()
    refetchPortfolioTokenOptions?.()
  }, [refetchPortfolioBalances, refetchPortfolioTokenOptions, refetchSearchTokens])

  return useMemo(
    () => ({
      data: searchResultsSections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, searchResultsSections],
  )
}
