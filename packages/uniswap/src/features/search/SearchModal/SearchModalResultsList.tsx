import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/TokenSelector/types'
import { useOnchainItemListSection } from 'uniswap/src/components/TokenSelector/utils'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { SearchModalItemTypes } from 'uniswap/src/components/lists/items/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokensRest } from 'uniswap/src/features/dataApi/searchTokensRest'
import { SearchModalList } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { MOCK_POOL_OPTION_ITEM } from 'uniswap/src/features/search/SearchModal/mocks'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

export function useSectionsForSearchResults(
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  activeTab: SearchTab,
): GqlResult<OnchainItemSection<SearchModalItemTypes>[]> {
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokensRest({
    searchQuery: searchFilter,
    chainFilter,
    skip: !searchFilter || (activeTab !== SearchTab.Tokens && activeTab !== SearchTab.All),
  })

  const tokenSearchResults = useCurrencyInfosToTokenOptions({ currencyInfos: searchResultCurrencies })
  const tokenSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: tokenSearchResults,
  })

  const poolSearchResultsSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Pools,
    options: Array(isWeb ? 4 : 0).fill(MOCK_POOL_OPTION_ITEM),
  })

  // on mobile, add search results sections for wallet & NFT

  const loading = searchTokensLoading
  const error = !tokenSearchResults && searchTokensError
  const refetchAll = useCallback(() => {
    refetchSearchTokens?.()
  }, [refetchSearchTokens])

  return useMemo(() => {
    let sections: OnchainItemSection<SearchModalItemTypes>[] = []
    switch (activeTab) {
      case SearchTab.All:
        sections = [...(tokenSearchResultsSection ?? []), ...(poolSearchResultsSection ?? [])]
        break
      case SearchTab.Tokens:
        sections = tokenSearchResultsSection ?? []
        break
      case SearchTab.Pools:
        sections = poolSearchResultsSection ?? []
    }

    return {
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }
  }, [activeTab, error, loading, poolSearchResultsSection, refetchAll, tokenSearchResultsSection])
}

interface SearchModalResultsListProps {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  activeTab: SearchTab
  onSelect: (item: SearchModalItemTypes) => void
}

function _SearchModalResultsList({
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  activeTab,
  onSelect,
}: SearchModalResultsListProps): JSX.Element {
  const { t } = useTranslation()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useSectionsForSearchResults(
    chainFilter ?? parsedChainFilter,
    debouncedParsedSearchFilter ?? debouncedSearchFilter,
    activeTab,
  )

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )

  return (
    <SearchModalList
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      onSelect={onSelect}
    />
  )
}

export const SearchModalResultsList = memo(_SearchModalResultsList)
