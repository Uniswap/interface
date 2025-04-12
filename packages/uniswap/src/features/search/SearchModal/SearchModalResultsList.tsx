import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { OnSelectCurrency, TokenOptionSection, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { formatSearchResults, useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { SearchModalItemTypes } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { SearchModalList } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import useIsKeyboardOpen from 'uniswap/src/hooks/useIsKeyboardOpen'

export function useSectionsForSearchResults(
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
): GqlResult<TokenSection<SearchModalItemTypes>[]> {
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens(searchFilter, chainFilter, /*skip*/ false)

  const searchResults = useMemo(() => {
    return formatSearchResults(searchResultCurrencies, undefined, searchFilter)
  }, [searchFilter, searchResultCurrencies])

  const searchResultsSections = useTokenOptionsSection({
    sectionKey: TokenOptionSection.SearchResults,
    tokenOptions: searchResults,
  })

  // on mobile, add search results sections for wallet & NFT

  const loading = searchTokensLoading
  const error = !searchResults && searchTokensError
  const refetchAll = useCallback(() => {
    refetchSearchTokens?.()
  }, [refetchSearchTokens])

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

function _SearchModalResultsList({
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  onSelectCurrency,
}: {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { t } = useTranslation()
  const isKeyboardOpen = useIsKeyboardOpen()
  const { registerSearch } = useAddToSearchHistory()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useSectionsForSearchResults(
    chainFilter ?? parsedChainFilter,
    debouncedParsedSearchFilter ?? debouncedSearchFilter,
  )

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )
  return (
    <SearchModalList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={(currencyInfo, section, index) => {
        onSelectCurrency(currencyInfo, section, index)
        registerSearch(currencyInfo)
      }}
    />
  )
}

export const SearchModalResultsList = memo(_SearchModalResultsList)
