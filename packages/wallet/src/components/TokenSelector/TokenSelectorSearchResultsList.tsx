import { memo, useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import {
  usePortfolioBalancesForAddressById,
  usePortfolioTokenOptions,
} from 'wallet/src/components/TokenSelector/hooks'
import {
  SectionHeader,
  TokenSelectorList,
} from 'wallet/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSection } from 'wallet/src/components/TokenSelector/types'
import {
  formatSearchResults,
  getTokenOptionsSection,
} from 'wallet/src/components/TokenSelector/utils'
import { ChainId } from 'wallet/src/constants/chains'
import { useSearchTokens } from 'wallet/src/features/dataApi/searchTokens'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { addToSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import { SearchResultType } from 'wallet/src/features/search/SearchResult'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch } from 'wallet/src/state'

function EmptyResults({ searchFilter }: { searchFilter: string }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex>
      <SectionHeader title={t('Search results')} />
      <Text color="$neutral3" textAlign="center" variant="subheading2">
        <Trans t={t}>
          No results found for <Text color="$neutral1">"{searchFilter}"</Text>
        </Trans>
      </Text>
    </Flex>
  )
}

function useTokenSectionsForSearchResults(
  chainFilter: ChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean
): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = usePortfolioBalancesForAddressById(activeAccountAddress)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter, searchFilter ?? undefined)

  // Only call search endpoint if isBalancesOnlySearch is false
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens(searchFilter, chainFilter, /*skip*/ isBalancesOnlySearch)

  const searchResults = useMemo(() => {
    return formatSearchResults(searchResultCurrencies, portfolioBalancesById, searchFilter)
  }, [searchResultCurrencies, portfolioBalancesById, searchFilter])

  const loading =
    portfolioTokenOptionsLoading ||
    portfolioBalancesByIdLoading ||
    (!isBalancesOnlySearch && searchTokensLoading)

  const sections = useMemo(
    () =>
      getTokenOptionsSection(
        t('Search results'),
        // Use local search when only searching balances
        isBalancesOnlySearch ? portfolioTokenOptions : searchResults
      ),
    [isBalancesOnlySearch, portfolioTokenOptions, searchResults, t]
  )

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!isBalancesOnlySearch && !searchResults && searchTokensError)

  const refetchAll = useCallback(() => {
    refetchPortfolioBalances?.()
    refetchSearchTokens?.()
    refetchPortfolioTokenOptions?.()
  }, [refetchPortfolioBalances, refetchPortfolioTokenOptions, refetchSearchTokens])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections]
  )
}

function _TokenSelectorSearchResultsList({
  onSelectCurrency: parentOnSelectCurrency,
  chainFilter,
  searchFilter,
  debouncedSearchFilter,
  isBalancesOnlySearch,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: ChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  isBalancesOnlySearch: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSearchResults(chainFilter, debouncedSearchFilter, isBalancesOnlySearch)

  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    if (currencyInfo.currency.symbol && currencyInfo.currency.isToken) {
      dispatch(
        addToSearchHistory({
          searchResult: {
            type: SearchResultType.Token,
            chainId: currencyInfo.currency.chainId,
            address: currencyInfo.currency.address,
            name: currencyInfo.currency.name ?? null,
            symbol: currencyInfo.currency.symbol,
            logoUrl: currencyInfo.logoUrl ?? null,
            safetyLevel: currencyInfo.safetyLevel ?? null,
          },
        })
      )
    }
  }

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () =>
      debouncedSearchFilter ? <EmptyResults searchFilter={debouncedSearchFilter} /> : undefined,
    [debouncedSearchFilter]
  )
  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('Couldn’t load search results')}
      hasError={Boolean(error)}
      loading={userIsTyping || loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
