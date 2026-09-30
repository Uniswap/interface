import { UniverseChainId } from '@universe/chains'
import { isExtensionApp, isWebApp } from '@universe/environment'
import {
  DynamicConfigs,
  useDynamicConfigValue,
  DisableWalletSearchTermsConfigKey,
  useIsTokenCategoriesEnabled,
  useIsV2EndpointsSearchEnabled,
} from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { useMultichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { useSearchAuctions } from 'uniswap/src/features/dataApi/searchAuctions'
import { useSearchCategoryIds } from 'uniswap/src/features/dataApi/searchCategories'
import { useSearchPools } from 'uniswap/src/features/dataApi/searchPools'
import { useMultichainSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { toCategoryOptions } from 'uniswap/src/features/search/SearchModal/categories/toCategoryOptions'
import { useEarnSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useEarnSearchResults'
import {
  getAllSections,
  getAuctionOptions,
  getIsPoolAddressSearch,
  getOptionsForActiveTab,
  getSearchResultsForActiveTab,
  getTokenAndPoolSections,
  getTokenOptions,
  getTruncatedSectionKeys,
  getWalletSearchQuery,
  refetchAuctionsIfEnabled,
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
  // Token search results
  const useMultichainPath = chainFilter === null

  // RWA (tokenized stock) grouping
  const rwaIndex = useRwaIndex()
  const isAddressSearch = isAddressTokenSearchQuery(searchFilter)
  const isSearchV2Enabled = useIsV2EndpointsSearchEnabled()

  const skipTokenSearch = shouldSkipSearch({ activeTab, searchFilter, searchTab: SearchTab.Tokens })

  const {
    data: multichainData,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    isLoading: searchTokensLoading,
  } = useMultichainSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipTokenSearch,
  })

  const searchResultCurrencies = useMemo(
    () => (!useMultichainPath ? multichainData?.flatMap((r) => r.tokens) : undefined),
    [useMultichainPath, multichainData],
  )
  const multichainResults = useMultichainPath ? multichainData : undefined

  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies })
  const multichainSearchOptions = useMultichainSearchResultsToOptions({ results: multichainResults })

  // Category search results: All tab only, and never on the extension, which has no Category Details surface.
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const categorySearchEnabled = tokenCategoriesEnabled && !isExtensionApp
  const skipCategorySearchQuery = !categorySearchEnabled || activeTab !== SearchTab.All || !searchFilter
  const {
    data: searchCategoryIds,
    refetch: refetchSearchCategories,
    isLoading: searchCategoriesQueryLoading,
  } = useSearchCategoryIds({ searchQuery: searchFilter, chainFilter, skip: skipCategorySearchQuery })
  // Guard the flag before trusting query state (as the auction path does) so a skipped query can't hold the spinner.
  const searchCategoriesLoading = !skipCategorySearchQuery && searchCategoriesQueryLoading
  const { categories } = useAllTokenCategories()
  const categoryOptions = useMemo(
    () => toCategoryOptions({ categoryIds: searchCategoryIds, categories }),
    [searchCategoryIds, categories],
  )

  // Pool search results
  const skipPoolSearchQuery = shouldSkipSearch({
    activeTab,
    enabled: isWebApp,
    searchFilter,
    searchTab: SearchTab.Pools,
  })
  const {
    data: searchResultPools,
    error: searchPoolsError,
    refetch: refetchSearchPools,
    isLoading: searchPoolsLoading,
  } = useSearchPools({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipPoolSearchQuery,
  })

  const isPoolAddressSearch = getIsPoolAddressSearch({
    searchFilter,
    searchResultPoolsLength: searchResultPools?.length,
  })

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
  const skipAuctionSearchQuery = shouldSkipSearch({
    activeTab,
    enabled: auctionSearchEnabled && isWebApp,
    searchFilter,
    searchTab: SearchTab.Auctions,
  })
  const {
    data: auctionSearchResults,
    error: searchAuctionsError,
    refetch: refetchSearchAuctions,
    isLoading: searchAuctionsLoading,
  } = useSearchAuctions({
    searchQuery: searchFilter,
    chainFilter,
    skip: skipAuctionSearchQuery,
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
            hoistRwaToTop: !isSearchV2Enabled,
            plainTokenNames: tokenCategoriesEnabled,
          })
        : tokenOptions,
    [rwaIndex, tokenOptions, isAddressSearch, chainFilter, isSearchV2Enabled, tokenCategoriesEnabled],
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

  const refetchAll = useCallback(() => {
    void refetchSearchTokens()
    void refetchSearchPools()
    if (categorySearchEnabled) {
      void refetchSearchCategories()
    }
    refetchAuctionsIfEnabled({ auctionSearchEnabled, refetchSearchAuctions })
  }, [
    auctionSearchEnabled,
    categorySearchEnabled,
    refetchSearchPools,
    refetchSearchTokens,
    refetchSearchCategories,
    refetchSearchAuctions,
  ])

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

  const auctionOptionsLength = auctionSearchEnabled ? (auctionSearchResults?.length ?? 0) : 0
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

  const searchResults = useMemo((): SearchModalSectionResult => {
    return getSearchResultsForActiveTab({
      activeTab,
      allSections,
      auctionSearchEnabled,
      auctionSearchResultsSection,
      earnSearchResultsSection,
      poolSearchOptionsLength: poolSearchOptions.length,
      poolSearchResultsLength: searchResultPools?.length,
      poolSearchResultsSection,
      refetchAll,
      refetchSearchAuctions,
      refetchSearchPools,
      refetchSearchTokens,
      searchAuctionsError,
      searchAuctionsLoading,
      searchCategoriesLoading,
      searchPoolsError,
      searchPoolsLoading,
      searchTokensError,
      searchTokensLoading,
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
    poolSearchOptions.length,
    poolSearchResultsSection,
    refetchAll,
    refetchSearchAuctions,
    refetchSearchPools,
    refetchSearchTokens,
    searchAuctionsError,
    searchAuctionsLoading,
    searchCategoriesLoading,
    searchPoolsError,
    searchPoolsLoading,
    searchResultPools?.length,
    searchTokensError,
    searchTokensLoading,
    tokenOptions.length,
    tokenSearchResultsSection,
    walletSearchResultsLoading,
    walletSearchResultsSection,
    earnSearchResultsSection,
  ])

  return useMemo(() => ({ ...searchResults, truncatedSectionKeys }), [searchResults, truncatedSectionKeys])
}
