import { useSectionsForSearchResults } from 'appGraphql/data/ring/SearchRingWeb'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchModalList, SearchModalListProps } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

interface SearchModalResultsListProps {
  chainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  activeTab: SearchTab
  onSelect?: SearchModalListProps['onSelect']
}

function _SearchModalResultsList({
  chainFilter,
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
  } = useSectionsForSearchResults(Chain.Ethereum, debouncedParsedSearchFilter ?? debouncedSearchFilter, activeTab)

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
      onSelect={onSelect}
    />
  )
}

export const SearchModalResultsList = memo(_SearchModalResultsList)
