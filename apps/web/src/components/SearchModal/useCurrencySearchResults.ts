import { t } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { CurrencyListRow, CurrencyListSectionTitle } from 'components/SearchModal/CurrencyList'
import { CurrencySearchFilters } from 'components/SearchModal/CurrencySearch'
import { useDefaultActiveTokens, useSearchInactiveTokenLists, useToken } from 'hooks/Tokens'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { getSortedPortfolioTokens, tokenQuerySortComparator } from 'lib/hooks/useTokenList/sorting'
import { useMemo } from 'react'
import { UserAddedToken } from 'types/tokens'

interface CurrencySearchParams {
  searchQuery?: string
  filters?: CurrencySearchFilters
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
}

interface CurrencySearchResults {
  searchCurrency?: Token | null
  allCurrencyRows: CurrencyListRow[]
}

export function useCurrencySearchResults({
  searchQuery,
  filters,
  selectedCurrency,
  otherSelectedCurrency,
}: CurrencySearchParams): CurrencySearchResults {
  const { chainId } = useWeb3React()

  // Queries for a single token directly by address, if the query is an address.
  const searchToken = useToken(searchQuery)

  const defaultAndUserAddedTokens = useDefaultActiveTokens(chainId)
  const { balanceMap, balanceList, loading: balancesAreLoading } = useTokenBalances()

  const { sortedCombinedTokens, portfolioTokens, sortedTokensWithoutPortfolio } = useMemo(() => {
    const filteredListTokens = Object.values(defaultAndUserAddedTokens)
      // Filter out tokens with balances so they aren't duplicated when we merge below.
      .filter((token) => !(token.address?.toLowerCase() in balanceMap))

    if (balancesAreLoading) {
      const sortedCombinedTokens = searchQuery
        ? filteredListTokens.filter(getTokenFilter(searchQuery)).sort(tokenQuerySortComparator(searchQuery))
        : filteredListTokens
      return {
        sortedCombinedTokens,
        portfolioTokens: [],
        sortedTokensWithoutPortfolio: sortedCombinedTokens,
      }
    }

    const portfolioTokens = getSortedPortfolioTokens(balanceList, balanceMap, chainId, {
      hideSmallBalances: false,
      hideSpam: true,
    })
    const mergedTokens = [...(portfolioTokens ?? []), ...filteredListTokens]

    const tokenFilter = (token: Token) => {
      if (filters?.onlyShowCurrenciesWithBalance) {
        if (token.isNative && token.symbol) {
          return balanceMap[token.symbol]?.usdValue > 0
        }

        return balanceMap[token.address?.toLowerCase()]?.usdValue > 0
      }

      if (token.isNative && filters?.disableNonToken) {
        return false
      }

      // If there is no query, filter out unselected user-added tokens with no balance.
      if (!searchQuery && token instanceof UserAddedToken) {
        if (selectedCurrency?.equals(token) || otherSelectedCurrency?.equals(token)) return true
        return balanceMap[token.address.toLowerCase()]?.usdValue > 0
      }

      return true
    }

    const sortedCombinedTokens = searchQuery
      ? mergedTokens.filter(getTokenFilter(searchQuery)).sort(tokenQuerySortComparator(searchQuery))
      : mergedTokens

    return {
      sortedCombinedTokens: sortedCombinedTokens.filter(tokenFilter),
      sortedTokensWithoutPortfolio: filteredListTokens.filter(tokenFilter),
      portfolioTokens: portfolioTokens.filter(tokenFilter),
    }
  }, [
    defaultAndUserAddedTokens,
    balancesAreLoading,
    balanceList,
    balanceMap,
    chainId,
    searchQuery,
    filters?.onlyShowCurrenciesWithBalance,
    filters?.disableNonToken,
    selectedCurrency,
    otherSelectedCurrency,
  ])

  // if no results on main list, expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    !filters?.onlyShowCurrenciesWithBalance && sortedCombinedTokens.length === 0 ? searchQuery : undefined
  )

  const finalCurrencyList: CurrencyListRow[] = useMemo(() => {
    const currencyListRowMapper = (token: Token) => new CurrencyListRow(token, false)
    if (searchQuery || portfolioTokens.length === 0) {
      return [
        new CurrencyListSectionTitle(searchQuery ? t`Search results` : t`Popular tokens`),
        ...sortedCombinedTokens.map(currencyListRowMapper),
        ...filteredInactiveTokens.map(currencyListRowMapper),
      ]
    } else if (sortedTokensWithoutPortfolio.length === 0 && filteredInactiveTokens.length === 0) {
      return [new CurrencyListSectionTitle(t`Your tokens`), ...portfolioTokens.map(currencyListRowMapper)]
    } else {
      return [
        new CurrencyListSectionTitle(t`Your tokens`),
        ...portfolioTokens.map(currencyListRowMapper),
        new CurrencyListSectionTitle(t`Popular tokens`),
        ...sortedTokensWithoutPortfolio.map(currencyListRowMapper),
        ...filteredInactiveTokens.map(currencyListRowMapper),
      ]
    }
  }, [searchQuery, filteredInactiveTokens, portfolioTokens, sortedCombinedTokens, sortedTokensWithoutPortfolio])

  return {
    searchCurrency: searchToken,
    allCurrencyRows: finalCurrencyList,
  }
}
