import { ContentStyle } from '@shopify/flash-list'
import { GqlResult, GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNftSearchResultsToNftCollectionOptions } from 'uniswap/src/components/lists/items/nfts/useNftSearchResultsToNftCollectionOptions'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchPools } from 'uniswap/src/features/dataApi/searchPools'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { NUMBER_OF_RESULTS_SHORT } from 'uniswap/src/features/search/SearchModal/constants'
import { useWalletSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useWalletSearchResults'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { isWebApp, isWebPlatform } from 'utilities/src/platform'
import { noop } from 'utilities/src/react/noop'

function useSectionsForSearchResults({
  chainFilter,
  searchFilter,
  activeTab,
  shouldPrioritizePools,
}: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  activeTab: SearchTab
  shouldPrioritizePools: boolean
}): GqlResult<OnchainItemSection<SearchModalOption>[]> {
  const viewExternalWalletsFeatureEnabled = useFeatureFlag(FeatureFlags.ViewExternalWalletsOnWeb)
  const walletSearchEnabledOnWeb = isWebApp && viewExternalWalletsFeatureEnabled
  const skipPoolSearchQuery =
    !isWebPlatform || !searchFilter || (activeTab !== SearchTab.Pools && activeTab !== SearchTab.All)
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
  const poolSearchOptions = usePoolSearchResultsToPoolOptions(searchResultPools ?? [])
  const poolSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Pools,
    options: poolSearchOptions,
  })

  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: !searchFilter || (activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All),
  })
  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies })
  const isPoolAddressSearch =
    searchFilter &&
    getValidAddress({ address: searchFilter, platform: Platform.EVM }) &&
    searchResultPools?.length === 1
  const tokenSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: isPoolAddressSearch ? [] : tokenSearchResults, // do not display tokens if pool address search (to avoid displaying V2 liquidity tokens in results)
  })

  // skip wallet search queries on web unless ViewExternalWalletsOnWeb feature flag is enabled
  const skipWalletSearchQuery =
    (isWebApp && !walletSearchEnabledOnWeb) || (activeTab !== SearchTab.Wallets && activeTab !== SearchTab.All)
  const { wallets: walletSearchOptions, loading: walletSearchResultsLoading } = useWalletSearchResults(
    skipWalletSearchQuery ? '' : (searchFilter ?? ''),
    chainFilter,
  )
  const walletSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Wallets,
    options: walletSearchOptions,
  })

  const skipNftSearchQuery = isWebPlatform || (activeTab !== SearchTab.NFTCollections && activeTab !== SearchTab.All)
  const {
    data: nftSearchResultsData,
    loading: searchNftResultsLoading,
    error: searchNftResultsError,
    refetch: refetchSearchNftResults,
  } = GraphQLApi.useCollectionSearchQuery({ variables: { query: searchFilter ?? '' }, skip: skipNftSearchQuery })
  const nftCollectionOptions = useNftSearchResultsToNftCollectionOptions(nftSearchResultsData, chainFilter)
  const nftCollectionSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.NFTCollections,
    options:
      activeTab === SearchTab.All ? nftCollectionOptions.slice(0, NUMBER_OF_RESULTS_SHORT) : nftCollectionOptions,
  })

  const refetchAll = useCallback(async () => {
    refetchSearchTokens?.()
    refetchSearchPools?.()
    await refetchSearchNftResults()
  }, [refetchSearchNftResults, refetchSearchPools, refetchSearchTokens])

  // eslint-disable-next-line complexity
  return useMemo((): GqlResult<OnchainItemSection<SearchModalOption>[]> => {
    let sections: OnchainItemSection<SearchModalOption>[] = []
    switch (activeTab) {
      case SearchTab.All:
        if (isWebPlatform) {
          const webSections = shouldPrioritizePools
            ? [...(poolSearchResultsSection ?? []), ...(tokenSearchResultsSection ?? [])]
            : [...(tokenSearchResultsSection ?? []), ...(poolSearchResultsSection ?? [])]
          sections = walletSearchEnabledOnWeb ? [...webSections, ...(walletSearchResultsSection ?? [])] : webSections
        } else {
          sections = [
            ...(tokenSearchResultsSection ?? []),
            ...(walletSearchResultsSection ?? []),
            ...(nftCollectionSearchResultsSection ?? []),
          ]
        }
        return {
          data: !searchTokensLoading ? sections : [],
          loading: searchTokensLoading, // only show loading&error state for loading tokens
          error: (!tokenSearchResults && searchTokensError) || undefined,
          refetch: refetchAll,
        }
      case SearchTab.Tokens:
        return {
          data: tokenSearchResultsSection ?? [],
          loading: searchTokensLoading,
          error: (!tokenSearchResults && searchTokensError) || undefined,
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
      case SearchTab.NFTCollections:
        return {
          data: nftCollectionSearchResultsSection ?? [],
          loading: searchNftResultsLoading,
          error: searchNftResultsError || undefined,
          refetch: refetchSearchNftResults,
        }
    }
  }, [
    activeTab,
    nftCollectionSearchResultsSection,
    poolSearchOptions.length,
    poolSearchResultsSection,
    refetchAll,
    refetchSearchNftResults,
    refetchSearchPools,
    refetchSearchTokens,
    searchNftResultsError,
    searchNftResultsLoading,
    searchPoolsError,
    searchPoolsLoading,
    searchResultPools?.length,
    searchTokensError,
    searchTokensLoading,
    shouldPrioritizePools,
    tokenSearchResults,
    tokenSearchResultsSection,
    walletSearchEnabledOnWeb,
    walletSearchResultsLoading,
    walletSearchResultsSection,
  ])
}

interface SearchModalResultsListProps {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  activeTab: SearchTab
  onSelect?: SearchModalListProps['onSelect']
  renderedInModal: boolean
  contentContainerStyle?: ContentStyle
}

function _SearchModalResultsList({
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  activeTab,
  onSelect,
  renderedInModal,
  contentContainerStyle,
}: SearchModalResultsListProps): JSX.Element {
  const { t } = useTranslation()

  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useSectionsForSearchResults({
    // turn off parsed chainFilter for pools (to avoid "eth usdc" searches filtering by eth mainnet)
    chainFilter: activeTab !== SearchTab.Pools ? (chainFilter ?? parsedChainFilter) : chainFilter,
    searchFilter: debouncedParsedSearchFilter ?? debouncedSearchFilter,
    activeTab,
    shouldPrioritizePools: (debouncedParsedSearchFilter ?? debouncedSearchFilter)?.includes('/') ?? false,
  })

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )

  return (
    <SearchModalList
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      searchFilters={{
        query: debouncedParsedSearchFilter ?? debouncedSearchFilter ?? undefined,
        searchChainFilter: chainFilter,
        searchTabFilter: activeTab,
      }}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
      onSelect={onSelect}
    />
  )
}

export const SearchModalResultsList = memo(_SearchModalResultsList)
