import { GqlResult } from '@universe/api'
import { isWebApp } from '@universe/environment'
import {
  DynamicConfigs,
  FeatureFlags,
  useDynamicConfigValue,
  useFeatureFlag,
  DisableWalletSearchTermsConfigKey,
} from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useMultichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchPools } from 'uniswap/src/features/dataApi/searchPools'
import { useMultichainSearchTokens, useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { NUMBER_OF_RESULTS_ALL_TAB } from 'uniswap/src/features/search/SearchModal/constants'
import { useWalletSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { noop } from 'utilities/src/react/noop'

export function useSectionsForSearchResults({
  chainFilter,
  searchFilter,
  activeTab,
  shouldPrioritizePools,
  shouldPrioritizeWallets,
}: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  activeTab: SearchTab
  shouldPrioritizePools: boolean
  shouldPrioritizeWallets: boolean
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  // Token search results
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const useMultichainPath = multichainTokenUxEnabled && chainFilter === null

  const skipTokenSearch = !searchFilter || (activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All)

  const {
    data: searchResultCurrencies,
    error: flatSearchTokensError,
    refetch: refetchFlatSearchTokens,
    loading: flatSearchTokensLoading,
  } = useSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipTokenSearch || useMultichainPath,
  })

  const {
    data: multichainResults,
    error: multichainTokensError,
    refetch: refetchMultichainTokens,
    loading: multichainTokensLoading,
  } = useMultichainSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipTokenSearch || !useMultichainPath,
  })

  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies })
  const multichainSearchOptions = useMultichainSearchResultsToOptions({ results: multichainResults })

  const searchTokensError = useMultichainPath ? multichainTokensError : flatSearchTokensError
  const searchTokensLoading = useMultichainPath ? multichainTokensLoading : flatSearchTokensLoading
  const refetchSearchTokens = useMultichainPath ? refetchMultichainTokens : refetchFlatSearchTokens

  // Pool search results
  const skipPoolSearchQuery =
    !isWebApp || !searchFilter || (activeTab !== SearchTab.Pools && activeTab !== SearchTab.All)
  const {
    data: searchResultPools,
    error: searchPoolsError,
    refetch: refetchSearchPools,
    loading: searchPoolsLoading,
  } = useSearchPools({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipPoolSearchQuery,
  })

  const isPoolAddressSearch =
    searchFilter &&
    getValidAddress({ address: searchFilter, platform: Platform.EVM }) &&
    searchResultPools?.length === 1

  // Wallet search results
  const disableWalletSearchTerms = useDynamicConfigValue<
    DynamicConfigs.DisableWalletSearchTerms,
    DisableWalletSearchTermsConfigKey.Terms,
    string[]
  >({
    config: DynamicConfigs.DisableWalletSearchTerms,
    key: DisableWalletSearchTermsConfigKey.Terms,
    defaultValue: [],
  })
  const lowercasedDisabledTerms = disableWalletSearchTerms.map((term) => term.toLowerCase())
  const shouldShowWallets = !searchFilter || !lowercasedDisabledTerms.includes(searchFilter.toLowerCase())

  const skipWalletSearchQuery = activeTab !== SearchTab.Wallets && activeTab !== SearchTab.All
  const { wallets: walletSearchOptions, loading: walletSearchResultsLoading } = useWalletSearchResults(
    skipWalletSearchQuery ? '' : (searchFilter ?? ''),
    chainFilter,
  )

  // Organized sections
  const tokenOptions: SearchModalOption[] = isPoolAddressSearch
    ? []
    : useMultichainPath
      ? (multichainSearchOptions ?? [])
      : (tokenSearchResults ?? [])
  const tokenSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: activeTab === SearchTab.All ? tokenOptions.slice(0, NUMBER_OF_RESULTS_ALL_TAB) : tokenOptions,
  })

  const poolSearchOptions = usePoolSearchResultsToPoolOptions(searchResultPools ?? [])
  const poolSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Pools,
    options: activeTab === SearchTab.All ? poolSearchOptions.slice(0, NUMBER_OF_RESULTS_ALL_TAB) : poolSearchOptions,
  })

  const walletSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Wallets,
    options: walletSearchOptions,
  })

  const refetchAll = useCallback(async () => {
    refetchSearchTokens?.()
    refetchSearchPools?.()
  }, [refetchSearchPools, refetchSearchTokens])

  const tokenAndPoolSections = useMemo(() => {
    if (isWebApp) {
      if (shouldPrioritizePools) {
        return [...(poolSearchResultsSection ?? []), ...(tokenSearchResultsSection ?? [])]
      } else {
        return [...(tokenSearchResultsSection ?? []), ...(poolSearchResultsSection ?? [])]
      }
    }
    return [...(tokenSearchResultsSection ?? [])]
  }, [poolSearchResultsSection, tokenSearchResultsSection, shouldPrioritizePools])

  const allSections = useMemo(() => {
    // Don't include wallets in all search results in some cases
    if (!shouldShowWallets) {
      return tokenAndPoolSections
    }

    // Prioritize wallets in all search results in some cases
    if (shouldPrioritizeWallets) {
      return [...(walletSearchResultsSection ?? []), ...tokenAndPoolSections]
    }

    return [...tokenAndPoolSections, ...(walletSearchResultsSection ?? [])]
  }, [tokenAndPoolSections, walletSearchResultsSection, shouldPrioritizeWallets, shouldShowWallets])

  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    switch (activeTab) {
      case SearchTab.All:
        return {
          data: !searchTokensLoading ? allSections : [],
          loading: searchTokensLoading || walletSearchResultsLoading,
          error: (!tokenOptions.length && searchTokensError) || undefined,
          refetch: refetchAll,
        }
      case SearchTab.Tokens:
        return {
          data: tokenSearchResultsSection ?? [],
          loading: searchTokensLoading,
          error: (!tokenOptions.length && searchTokensError) || undefined,
          refetch: refetchSearchTokens,
        }
      case SearchTab.Pools:
        return {
          data: poolSearchResultsSection ?? [],
          loading: searchPoolsLoading || (poolSearchOptions.length === 0 && searchResultPools?.length !== 0),
          error: (!poolSearchResultsSection && searchPoolsError) || undefined,
          refetch: refetchSearchPools,
        }
      case SearchTab.Wallets:
        return {
          data: walletSearchResultsSection ?? [],
          loading: walletSearchResultsLoading,
          refetch: noop,
        }
      default:
        return {
          data: [],
          loading: false,
          error: undefined,
          refetch: noop,
        }
    }
  }, [
    activeTab,
    refetchSearchTokens,
    searchTokensError,
    searchTokensLoading,
    poolSearchOptions.length,
    poolSearchResultsSection,
    refetchAll,
    refetchSearchPools,
    searchPoolsError,
    searchPoolsLoading,
    searchResultPools?.length,
    tokenOptions.length,
    tokenSearchResultsSection,
    walletSearchResultsLoading,
    walletSearchResultsSection,
    allSections,
  ])
}
