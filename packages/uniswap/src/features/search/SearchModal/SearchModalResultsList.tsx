import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenOptionSection, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { formatSearchResults, useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { PoolOption, SearchModalItemTypes } from 'uniswap/src/components/lists/types'
import { ProtocolVersion } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { SearchModalList } from 'uniswap/src/features/search/SearchModal/SearchModalList'
import { isWeb } from 'utilities/src/platform'

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
    return formatSearchResults(searchResultCurrencies, undefined)
  }, [searchResultCurrencies])

  const searchTokensSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.SearchResults,
    tokenOptions: searchResults,
  })

  // on web, add search results sections for pools
  const MOCK_POOLS_SECTION: TokenSection<PoolOption>[] = useMemo(
    () => [
      {
        sectionKey: TokenOptionSection.PopularTokens, // temp
        data: [
          {
            poolId: '0x1234567890123456789012345678901234567890',
            chainId: UniverseChainId.Unichain,
            token0CurrencyInfo: {
              currency: {
                chainId: UniverseChainId.Unichain,
                address: '0x1234567890123456789012345678901234567890',
                decimals: 18,
                name: 'Unichain',
                symbol: 'UNI',
              },
            },
            token1CurrencyInfo: {
              currency: {
                chainId: UniverseChainId.Unichain,
                address: '0x1234567890123456789012345678901234567890',
                decimals: 18,
                name: 'Unichain',
                symbol: 'UNI',
              },
            },
            hookAddress: '0x1234567890123456789012345678901234567890',
            protocolVersion: ProtocolVersion.V3,
            feeTier: 3000,
          } as PoolOption,
        ],
      },
    ],
    [],
  )

  // on mobile, add search results sections for wallet & NFT

  const loading = searchTokensLoading
  const error = !searchResults && searchTokensError
  const refetchAll = useCallback(() => {
    refetchSearchTokens?.()
  }, [refetchSearchTokens])

  const sections = useMemo(
    () => [...(searchTokensSection ?? []), ...(isWeb ? MOCK_POOLS_SECTION : [])],
    [MOCK_POOLS_SECTION, searchTokensSection],
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections],
  )
}

function _SearchModalResultsList({
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  onSelect,
}: {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  onSelect: (item: SearchModalItemTypes) => void
}): JSX.Element {
  const { t } = useTranslation()
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
