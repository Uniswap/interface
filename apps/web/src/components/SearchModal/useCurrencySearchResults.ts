import { Currency } from '@uniswap/sdk-core'
import { CurrencyListRow, CurrencyListSectionTitle } from 'components/SearchModal/CurrencyList'
import { CurrencySearchFilters } from 'components/SearchModal/DeprecatedCurrencySearch'
import { chainIdToBackendChain, useSupportedChainId } from 'constants/chains'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { useFallbackListTokens, useToken } from 'hooks/Tokens'
import { useTokenBalances } from 'hooks/useTokenBalances'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { getSortedPortfolioTokens } from 'lib/hooks/useTokenList/sorting'
import { useMemo } from 'react'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { useUserAddedTokens } from 'state/user/userAddedTokens'
import { UserAddedToken } from 'types/tokens'
import {
  Chain,
  Token as GqlToken,
  TokenSortableField,
  useSearchTokensWebQuery,
  useTopTokensQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { t } from 'uniswap/src/i18n'
import { isSameAddress } from 'utilities/src/addresses'
import { currencyKey } from 'utils/currencyKey'

interface CurrencySearchParams {
  searchQuery?: string
  filters?: CurrencySearchFilters
  selectedCurrency?: Currency | null
  otherSelectedCurrency?: Currency | null
  operatedPools?: Currency[]
}

interface CurrencySearchResults {
  searchCurrency?: Currency | null
  allCurrencyRows: CurrencyListRow[]
  loading: boolean
}

const currencyListRowMapper = (currency: Currency) => new CurrencyListRow(currency)
const searchResultsCurrencyListMapper = (currency: Currency) => new CurrencyListRow(currency, { showAddress: true })
const gqlCurrencyMapper = (gqlToken: any) => {
  const currencyInfo = gqlTokenToCurrencyInfo(gqlToken as GqlToken)
  return currencyInfo ? currencyInfo.currency : undefined
}

function isEmpty(query: string | undefined): query is undefined {
  return !query || query.length === 0
}

export function useCurrencySearchResults({
  searchQuery,
  filters,
  selectedCurrency,
  otherSelectedCurrency,
  operatedPools,
}: CurrencySearchParams): CurrencySearchResults {
  const { chainId } = useSwapAndLimitContext()
  const supportedChain = useSupportedChainId(chainId)

  /**
   * GraphQL queries for tokens and search results
   */
  const { data: searchResults, loading: searchResultsLoading } = useSearchTokensWebQuery({
    variables: {
      searchQuery: searchQuery ?? '',
      chains: [chainIdToBackendChain({ chainId: supportedChain, withFallback: true }) ?? Chain.Ethereum],
    },
    skip: !searchQuery,
  })
  const { data: popularTokens, loading: popularTokensLoading } = useTopTokensQuery({
    fetchPolicy: 'cache-first',
    variables: {
      chain: chainIdToBackendChain({ chainId: supportedChain, withFallback: true }) ?? Chain.Ethereum,
      orderBy: TokenSortableField.Popularity,
      page: 1,
      pageSize: 100,
    },
  })
  const sortedPopularTokens = useMemo(() => {
    if (!popularTokens?.topTokens) {
      return undefined
    }
    return [...popularTokens.topTokens].sort((a, b) => {
      if (a?.project?.name && b?.project?.name) {
        return a.project.name.localeCompare(b.project.name)
      }
      return 0
    })
  }, [popularTokens?.topTokens])
  const { balanceMap, balanceList, loading: balancesLoading } = useTokenBalances()

  /**
   * Token-list based results.
   */

  // Queries for a single token directly by address, if the query is an address.
  const searchToken = useToken(searchQuery)
  const defaultAndUserAddedTokens = useFallbackListTokens(chainId)
  const userAddedTokens = useUserAddedTokens()

  const gqlSearchResultsEmpty =
    (!searchResults?.searchTokens || searchResults.searchTokens.length === 0) && !searchResultsLoading
  const gqlPopularTokensEmpty =
    (!popularTokens?.topTokens || popularTokens.topTokens.length === 0) && !popularTokensLoading

  /**
   * Results processing: sorting, filtering, and merging data sources into the final list.
   */
  // TODO: must append operated pools here for when user wants to switch pool
  const { sortedCombinedTokens, portfolioTokens, sortedTokensWithoutPortfolio } = useMemo(() => {
    const fullBaseList = (() => {
      if (filters?.onlyDisplaySmartPools) {
        return [...(operatedPools ?? [])]
      } else if ((!isEmpty(searchQuery) && gqlSearchResultsEmpty) || (isEmpty(searchQuery) && gqlPopularTokensEmpty)) {
        return Object.values(defaultAndUserAddedTokens).filter((userAddedToken) => {
          return operatedPools?.map(
            (pool) => {
              !pool.isNative && pool.address?.toLowerCase() !== userAddedToken.address.toLowerCase()
            },
            [operatedPools, userAddedToken]
          )
        })
      } else if (!isEmpty(searchQuery)) {
        return [
          ...((searchResults?.searchTokens?.map(gqlCurrencyMapper).filter(Boolean) as Currency[]) ?? []),
          ...userAddedTokens.filter(getTokenFilter(searchQuery)).filter((userAddedToken) => {
            return (
              operatedPools?.map(
                (pool) => {
                  !pool.isNative && pool.address?.toLowerCase() !== userAddedToken.address.toLowerCase()
                },
                [operatedPools, userAddedToken]
              ) && !searchResults?.searchTokens?.find((token) => isSameAddress(token?.address, userAddedToken.address))
            )
          })
        ]
      } else {
        return [
          ...((sortedPopularTokens?.map(gqlCurrencyMapper).filter(Boolean) as Currency[]) ?? []),
          ...userAddedTokens,
        ]
      }
    })()

    // If we're using gql token lists and there's a search query, we don't need to
    // filter because the backend already does it for us.
    if (!isEmpty(searchQuery) && !gqlSearchResultsEmpty) {
      return {
        sortedCombinedTokens: fullBaseList,
        portfolioTokens: [],
        sortedTokensWithoutPortfolio: fullBaseList,
      }
    }

    // Filter out tokens with balances so they aren't duplicated when we merge below.
    const filteredListTokens = fullBaseList.filter((token) => {
      const key = currencyKey(token)
      return !(key in balanceMap)
    })

    if (balancesLoading) {
      return {
        sortedCombinedTokens: filteredListTokens,
        portfolioTokens: [],
        sortedTokensWithoutPortfolio: filteredListTokens,
      }
    }

    const portfolioTokens = getSortedPortfolioTokens(balanceList, balanceMap, chainId, {
      hideSmallBalances: false,
      hideSpam: true,
    })
    const mergedTokens = [...(!filters?.onlyDisplaySmartPools ? portfolioTokens ?? [] : []), ...filteredListTokens]

    // This is where we apply extra filtering based on the callsite's
    // customization, on top of the basic searchQuery filtering.
    const currencyFilter = (currency: Currency) => {
      const key = currencyKey(currency)
      if (filters?.onlyDisplaySmartPools) {
        return (
          !currency.isNative &&
          operatedPools?.map(
            (pool) => {
              !pool.isNative && pool.address?.toLowerCase() === currency.address.toLowerCase()
            },
            [operatedPools, currency]
          )
        )
      }

      if (filters?.onlyShowCurrenciesWithBalance) {
        if (currency.isNative) {
          return balanceMap[key]?.usdValue > 0
        }

        return balanceMap[key]?.usdValue > 0
      }

      if (currency.isNative && filters?.disableNonToken) {
        return false
      }

      // If there is no query, filter out unselected user-added tokens with no balance.
      if (isEmpty(searchQuery) && currency instanceof UserAddedToken) {
        if (selectedCurrency?.equals(currency) || otherSelectedCurrency?.equals(currency)) {
          return true
        }
        return balanceMap[key]?.usdValue > 0
      }

      return true
    }

    const sortedCombinedTokens =
      !isEmpty(searchQuery) && gqlSearchResultsEmpty ? mergedTokens.filter(getTokenFilter(searchQuery)) : mergedTokens

    return {
      sortedCombinedTokens: sortedCombinedTokens.filter(currencyFilter),
      sortedTokensWithoutPortfolio: filteredListTokens.filter(currencyFilter),
      portfolioTokens: portfolioTokens.filter(currencyFilter),
    }
  }, [
    searchQuery,
    gqlSearchResultsEmpty,
    balancesLoading,
    balanceList,
    balanceMap,
    chainId,
    gqlPopularTokensEmpty,
    defaultAndUserAddedTokens,
    searchResults?.searchTokens,
    userAddedTokens,
    sortedPopularTokens,
    filters?.onlyShowCurrenciesWithBalance,
    filters?.disableNonToken,
    filters?.onlyDisplaySmartPools,
    operatedPools,
    selectedCurrency,
    otherSelectedCurrency,
  ])

  const finalCurrencyList: CurrencyListRow[] = useMemo(() => {
    if (filters?.onlyDisplaySmartPools) {
      return [new CurrencyListSectionTitle(t`Your smart pools`), ...sortedCombinedTokens.map(currencyListRowMapper)]
    } else if (!isEmpty(searchQuery) || portfolioTokens.length === 0) {
      return [
        new CurrencyListSectionTitle(
          searchQuery ? t('tokens.selector.section.search') : t('tokens.selector.section.popular'),
        ),
        ...sortedCombinedTokens.map(searchQuery ? searchResultsCurrencyListMapper : currencyListRowMapper),
      ]
    } else if (sortedTokensWithoutPortfolio.length === 0) {
      return [
        new CurrencyListSectionTitle(t('tokens.selector.section.yours')),
        ...portfolioTokens.map(currencyListRowMapper),
      ]
    } else {
      return [
        new CurrencyListSectionTitle(t('tokens.selector.section.yours')),
        ...portfolioTokens.map(currencyListRowMapper),
        new CurrencyListSectionTitle(t('tokens.selector.section.popular')),
        ...sortedTokensWithoutPortfolio.map(currencyListRowMapper),
      ]
    }
  }, [searchQuery, portfolioTokens, sortedTokensWithoutPortfolio, sortedCombinedTokens, filters?.onlyDisplaySmartPools])

  return {
    loading: searchResultsLoading || popularTokensLoading || balancesLoading,
    searchCurrency: searchToken,
    allCurrencyRows: finalCurrencyList,
  }
}
