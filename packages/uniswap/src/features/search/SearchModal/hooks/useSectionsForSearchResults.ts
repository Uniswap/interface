import { UniverseChainId } from '@universe/chains'
import { isExtensionApp } from '@universe/environment'
import {
  DynamicConfigs,
  useDynamicConfigValue,
  DisableWalletSearchTermsConfigKey,
  useIsTokenCategoriesEnabled,
} from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useMultichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { useSearchAuctionOptions } from 'uniswap/src/features/dataApi/searchAuctions'
import { useSearchResults } from 'uniswap/src/features/dataApi/searchResults'
import { toCategoryOptions } from 'uniswap/src/features/search/SearchModal/categories/toCategoryOptions'
import { useEarnSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useEarnSearchResults'
import {
  getAllSections,
  getAuctionOptions,
  getIsPoolAddressSearch,
  getOptionsForActiveTab,
  getSearchResultsForActiveTab,
  getSearchTypes,
  getTokenAndPoolSections,
  getTokenOptions,
  getTruncatedSectionKeys,
  getWalletSearchQuery,
  isActiveSearchTab,
  type SearchModalSectionResult,
  shouldShowWalletSearch,
  shouldSkipSearch,
  withCategoryOptions,
} from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import { useWalletSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults'
import { applyRwaGroupingToSearchOptions } from 'uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { isAddressTokenSearchQuery } from 'uniswap/src/features/search/utils'

export function useSectionsForSearchResults({
  chainFilter,
  searchFilter,
  activeTab,
  auctionSearchEnabled = false,
  shouldPrioritizePools,
  shouldPrioritizeWallets,
}: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  activeTab: SearchTab
  auctionSearchEnabled?: boolean
  shouldPrioritizePools: boolean
  shouldPrioritizeWallets: boolean
}): SearchModalSectionResult & { truncatedSectionKeys: OnchainItemSectionName[] } {
  const useMultichainPath = chainFilter === null

  // RWA (tokenized stock) grouping
  const rwaIndex = useRwaIndex()
  const isAddressSearch = isAddressTokenSearchQuery(searchFilter)

  // Category rows render on the All tab only, and never on the extension, which has no Category Details surface.
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const categorySearchEnabled = tokenCategoriesEnabled && !isExtensionApp

  // One SearchService request for every type this surface can show. Requesting them all regardless of the
  // active tab keeps tab switches on the cached response instead of refetching per tab.
  const searchTypes = useMemo(
    () => getSearchTypes({ auctionSearchEnabled, categorySearchEnabled }),
    [auctionSearchEnabled, categorySearchEnabled],
  )
  const {
    data: searchResults,
    error: searchError,
    refetch: refetchSearchResults,
    isLoading: searchLoading,
  } = useSearchResults({
    searchQuery: searchFilter,
    chainFilter,
    types: searchTypes,
    skip: shouldSkipSearch({ activeTab, searchFilter }),
  })

  // Token search results
  const multichainData = searchResults?.tokens
  const searchResultCurrencies = useMemo(
    () => (!useMultichainPath ? multichainData?.flatMap((r) => r.tokens) : undefined),
    [useMultichainPath, multichainData],
  )
  const multichainResults = useMultichainPath ? multichainData : undefined

  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies })
  const multichainSearchOptions = useMultichainSearchResultsToOptions({ results: multichainResults })

  // Category search results
  const { categories } = useAllTokenCategories()
  const categoryOptions = useMemo(
    () => toCategoryOptions({ categoryIds: searchResults?.categoryIds, categories }),
    [searchResults?.categoryIds, categories],
  )

  // Pool search results
  const searchResultPools = searchResults?.pools
  // Pools arrive even on the Tokens tab now, so gate the pool-address special case to the tabs that show pools.
  const isPoolAddressSearch =
    isActiveSearchTab(activeTab, SearchTab.Pools) &&
    getIsPoolAddressSearch({ searchFilter, searchResultPoolsLength: searchResultPools?.length })

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
  const shouldShowWallets = shouldShowWalletSearch(searchFilter, lowercasedDisabledTerms)

  const { wallets: walletSearchOptions, loading: walletSearchResultsLoading } = useWalletSearchResults(
    getWalletSearchQuery({ activeTab, searchFilter }),
    chainFilter,
  )

  // Auction search results
  const { data: auctionSearchResults, refetch: refetchAuctionOverrides } = useSearchAuctionOptions({
    auctions: searchResults?.auctions,
    searchQuery: searchFilter,
    chainFilter,
    skip:
      !auctionSearchEnabled ||
      !isActiveSearchTab(activeTab, SearchTab.Auctions) ||
      shouldSkipSearch({ activeTab, searchFilter }),
  })

  // Organized sections
  const tokenOptions: SearchModalOption[] = useMemo(
    () =>
      getTokenOptions({
        isPoolAddressSearch,
        multichainSearchOptions,
        tokenSearchResults,
        useMultichainPath,
      }),
    [isPoolAddressSearch, useMultichainPath, multichainSearchOptions, tokenSearchResults],
  )
  const groupedTokenOptions = useMemo(
    () =>
      rwaIndex.rwas.length
        ? applyRwaGroupingToSearchOptions({
            options: tokenOptions,
            index: rwaIndex,
            isAddressSearch,
            chainFilter,
            plainTokenNames: tokenCategoriesEnabled,
          })
        : tokenOptions,
    [rwaIndex, tokenOptions, isAddressSearch, chainFilter, tokenCategoriesEnabled],
  )
  const tokenSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: withCategoryOptions({
      activeTab,
      categoryOptions,
      options: getOptionsForActiveTab({ activeTab, options: groupedTokenOptions }),
      searchFilter,
    }),
  })

  // Earn section: shown above the fold when an address search resolves to a vault share token.
  const earnSearchOptions = useEarnSearchResults({ searchFilter, activeTab, tokenOptions })
  const earnSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Earn,
    options: earnSearchOptions,
  })

  const poolSearchOptions = usePoolSearchResultsToPoolOptions(searchResultPools ?? [])
  const poolSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Pools,
    options: getOptionsForActiveTab({ activeTab, options: poolSearchOptions }),
  })

  const walletSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Wallets,
    options: walletSearchOptions,
  })

  const auctionSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Auctions,
    options: getAuctionOptions({ activeTab, auctionSearchEnabled, auctionSearchResults }),
  })

  const refetch = useCallback(() => {
    void refetchSearchResults()
    if (auctionSearchEnabled) {
      void refetchAuctionOverrides()
    }
  }, [auctionSearchEnabled, refetchSearchResults, refetchAuctionOverrides])

  const tokenAndPoolSections = useMemo(() => {
    return getTokenAndPoolSections({ poolSearchResultsSection, shouldPrioritizePools, tokenSearchResultsSection })
  }, [poolSearchResultsSection, tokenSearchResultsSection, shouldPrioritizePools])

  const allSections = useMemo(() => {
    return getAllSections({
      auctionSearchResultsSection,
      earnSearchResultsSection,
      shouldPrioritizeWallets,
      shouldShowWallets,
      tokenAndPoolSections,
      walletSearchResultsSection,
    })
  }, [
    earnSearchResultsSection,
    tokenAndPoolSections,
    walletSearchResultsSection,
    auctionSearchResultsSection,
    shouldPrioritizeWallets,
    shouldShowWallets,
  ])

  const auctionOptionsLength = auctionSearchEnabled ? auctionSearchResults.length : 0
  const truncatedSectionKeys = useMemo(
    () =>
      getTruncatedSectionKeys({
        activeTab,
        tokenOptionsLength: groupedTokenOptions.length,
        poolOptionsLength: poolSearchOptions.length,
        auctionOptionsLength,
      }),
    [activeTab, groupedTokenOptions.length, poolSearchOptions.length, auctionOptionsLength],
  )

  const sectionsForActiveTab = useMemo((): SearchModalSectionResult => {
    return getSearchResultsForActiveTab({
      activeTab,
      allSections,
      auctionSearchEnabled,
      auctionSearchResultsSection,
      earnSearchResultsSection,
      poolSearchOptionsLength: poolSearchOptions.length,
      poolSearchResultsLength: searchResultPools?.length,
      poolSearchResultsSection,
      refetch,
      searchError,
      searchLoading,
      tokenOptionsLength: tokenOptions.length,
      tokenSearchResultsSection,
      walletSearchResultsLoading,
      walletSearchResultsSection,
    })
  }, [
    activeTab,
    allSections,
    auctionSearchEnabled,
    auctionSearchResultsSection,
    earnSearchResultsSection,
    poolSearchOptions.length,
    poolSearchResultsSection,
    refetch,
    searchError,
    searchLoading,
    searchResultPools?.length,
    tokenOptions.length,
    tokenSearchResultsSection,
    walletSearchResultsLoading,
    walletSearchResultsSection,
  ])

  return useMemo(
    () => ({ ...sectionsForActiveTab, truncatedSectionKeys }),
    [sectionsForActiveTab, truncatedSectionKeys],
  )
}
