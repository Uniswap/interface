import { ContentStyle } from '@shopify/flash-list'
import { memo, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkError, NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSectionsForSearchResults } from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResults'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { useMultichainSearchModalMetricsAnalytics } from 'uniswap/src/features/search/SearchModal/useMultichainSearchModalMetricsAnalytics'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'

interface SearchModalResultsListProps {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  activeTab: SearchTab
  onSelect?: SearchModalListProps['onSelect']
  onResetFilters?: () => void
  renderedInModal: boolean
  contentContainerStyle?: ContentStyle
}

function SearchModalResultsListInner({
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  activeTab,
  onSelect,
  onResetFilters,
  renderedInModal,
  contentContainerStyle,
}: SearchModalResultsListProps): JSX.Element {
  const { t } = useTranslation()
  const isOffline = useIsOffline()

  const searchQuery = debouncedParsedSearchFilter ?? debouncedSearchFilter
  const shouldPrioritizeWallets =
    searchQuery?.toLowerCase().endsWith('.eth') || searchQuery?.toLowerCase().endsWith('.uni')

  /** Align with token search: network from UI filter or parsed from query (e.g. "Unichain ETH"). Pools tab uses UI filter only. */
  const effectiveTokenSearchChainFilter = useMemo((): UniverseChainId | null => {
    if (activeTab === SearchTab.Pools) {
      return chainFilter
    }
    return chainFilter ?? parsedChainFilter
  }, [activeTab, chainFilter, parsedChainFilter])

  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useSectionsForSearchResults({
    chainFilter: effectiveTokenSearchChainFilter,
    searchFilter: searchQuery,
    activeTab,
    shouldPrioritizePools: searchQuery?.includes('/') ?? false,
    shouldPrioritizeWallets: shouldPrioritizeWallets ?? false,
  })

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const hasData = Boolean(sections?.length)
  const isOfflineWithNoData = isOffline && !hasData
  const hasActiveFilters = chainFilter !== null || activeTab !== SearchTab.All

  const sectionsForMetrics = useMemo(() => (isOfflineWithNoData ? [] : sections), [isOfflineWithNoData, sections])

  useMultichainSearchModalMetricsAnalytics({
    sections: sectionsForMetrics,
    isSearchResultsLoading: loading,
    isSearchQueryPending: userIsTyping,
  })

  const prevIsOffline = usePreviousWithLayoutEffect(isOffline)
  const hasReconnected = prevIsOffline && !isOffline
  useEffect(() => {
    if (hasReconnected) {
      refetch?.()
    }
  }, [hasReconnected, refetch])

  const emptyElement = useMemo(() => {
    if (isOfflineWithNoData) {
      return <NetworkError />
    }

    return debouncedSearchFilter ? (
      <NoResultsFound
        searchFilter={debouncedSearchFilter}
        onResetPressed={hasActiveFilters ? onResetFilters : undefined}
      />
    ) : undefined
  }, [debouncedSearchFilter, isOfflineWithNoData, hasActiveFilters, onResetFilters])

  return (
    <SearchModalList
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={!isOffline && Boolean(error)}
      loading={!isOffline && (userIsTyping || loading)}
      refetch={refetch}
      sections={isOfflineWithNoData ? [] : sections}
      searchFilters={{
        query: debouncedParsedSearchFilter ?? debouncedSearchFilter ?? undefined,
        searchChainFilter: effectiveTokenSearchChainFilter,
        searchTabFilter: activeTab,
      }}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
      onSelect={onSelect}
    />
  )
}

export const SearchModalResultsList = memo(SearchModalResultsListInner)
