import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Text, TouchableArea } from 'ui/src'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import {
  currencyInfosToTokenOptions,
  filterRecentlySearchedTokenOptions,
  useCurrencyInfosToTokenOptions,
  usePortfolioBalancesForAddressById,
} from 'uniswap/src/components/TokenSelector/hooks'
import { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { PortfolioValueModifier } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { gqlTokenToCurrencyInfo, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'
import { addToSearchHistory, clearSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import { selectSearchHistory } from 'wallet/src/features/search/selectSearchHistory'
import { usePopularTokens as usePopularWalletTokens } from 'wallet/src/features/tokens/hooks'

export function useFavoriteCurrencies(): GqlResult<CurrencyInfo[]> {
  const favoriteCurrencyIds = useSelector(selectFavoriteTokens)
  const { data: favoriteTokensOnAllChains, loading, error, refetch } = useTokenProjects(favoriteCurrencyIds)

  const persistedError = usePersistedError(loading, error)

  // useTokenProjects returns each token on Arbitrum, Optimism, Polygon,
  // so we need to filter out the tokens which user has actually favorited
  const favoriteTokens = useMemo(
    () =>
      favoriteTokensOnAllChains &&
      favoriteCurrencyIds
        .map((_currencyId) => {
          return favoriteTokensOnAllChains.find((token) => token.currencyId === _currencyId)
        })
        .filter((token: CurrencyInfo | undefined): token is CurrencyInfo => {
          return !!token
        }),
    [favoriteCurrencyIds, favoriteTokensOnAllChains],
  )

  return { data: favoriteTokens, loading, error: persistedError, refetch }
}

export function useAddToSearchHistory(): { registerSearch: (currencyInfo: CurrencyInfo) => void } {
  const dispatch = useDispatch()

  const registerSearch = (currencyInfo: CurrencyInfo): void => {
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
        }),
      )
    }
  }

  return { registerSearch }
}

export function useFavoriteTokensOptions(
  address: Address,
  chainFilter: UniverseChainId | null,
  valueModifiers?: PortfolioValueModifier[],
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address, valueModifiers)

  const {
    data: favoriteCurrencies,
    error: favoriteCurrenciesError,
    refetch: refetchFavoriteCurrencies,
    loading: loadingFavoriteCurrencies,
  } = useFavoriteCurrencies()

  const favoriteTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: favoriteCurrencies,
    portfolioBalancesById,
    sortAlphabetically: true,
  })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchFavoriteCurrencies?.()
  }, [portfolioBalancesByIdRefetch, refetchFavoriteCurrencies])

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) || (!favoriteCurrencies && favoriteCurrenciesError)

  const filteredFavoriteTokenOptions = useMemo(
    () => favoriteTokenOptions && filter(favoriteTokenOptions, chainFilter),
    [chainFilter, favoriteTokenOptions],
  )

  return {
    data: filteredFavoriteTokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingFavoriteCurrencies,
  }
}

function ClearAll({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Text color="$accent1" variant="buttonLabel3">
        {t('tokens.selector.button.clear')}
      </Text>
    </TouchableArea>
  )
}

export function useTokenSectionsForEmptySearch(): GqlResult<TokenSection[]> {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { popularTokens, loading } = usePopularWalletTokens()

  const searchHistory = useSelector(selectSearchHistory)
  const recentlySearchedTokenOptions = filterRecentlySearchedTokenOptions(searchHistory as TokenSearchResult[])

  // it's a depenedency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  const sections = useMemo(
    () => [
      ...(getTokenOptionsSection(
        t('tokens.selector.section.recent'),
        recentlySearchedTokenOptions,
        <ClearAll onPress={onPressClearSearchHistory} />,
      ) ?? []),
      ...(getTokenOptionsSection(
        t('tokens.selector.section.popular'),
        currencyInfosToTokenOptions(popularTokens?.map(gqlTokenToCurrencyInfo)),
      ) ?? []),
    ],
    [onPressClearSearchHistory, popularTokens, recentlySearchedTokenOptions, t],
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
    }),
    [loading, sections],
  )
}
