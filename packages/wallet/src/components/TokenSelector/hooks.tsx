/* eslint-disable max-lines */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Text, TouchableArea } from 'ui/src'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { TokenOption, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import {
  createEmptyBalanceOption,
  formatSearchResults,
  getTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { BRIDGED_BASE_ADDRESSES } from 'uniswap/src/constants/addresses'
import { DAI, USDC, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { usePopularTokens } from 'uniswap/src/features/dataApi/topTokens'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, gqlTokenToCurrencyInfo, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { flowToModalName } from 'wallet/src/components/TokenSelector/flowToModalName'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'wallet/src/features/dataApi/balances'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'
import { TokenSearchResult } from 'wallet/src/features/search/SearchResult'
import { addToSearchHistory, clearSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import { selectSearchHistory } from 'wallet/src/features/search/selectSearchHistory'
import { usePopularTokens as usePopularWalletTokens } from 'wallet/src/features/tokens/hooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppSelector } from 'wallet/src/state'

// Use Mainnet base token addresses since TokenProjects query returns each token
// on each network
const baseCurrencyIds = [
  buildNativeCurrencyId(UniverseChainId.Mainnet),
  buildNativeCurrencyId(UniverseChainId.Polygon),
  buildNativeCurrencyId(UniverseChainId.Bnb),
  buildNativeCurrencyId(UniverseChainId.Celo),
  buildNativeCurrencyId(UniverseChainId.Avalanche),
  currencyId(DAI),
  currencyId(USDC),
  currencyId(USDT),
  currencyId(WBTC),
  buildWrappedNativeCurrencyId(UniverseChainId.Mainnet),
]

export function useAllCommonBaseCurrencies(): GqlResult<CurrencyInfo[]> {
  return useCurrencies(baseCurrencyIds)
}

export function useCurrencies(currencyIds: string[]): GqlResult<CurrencyInfo[]> {
  const { data: baseCurrencyInfos, loading, error, refetch } = useTokenProjects(currencyIds)
  const persistedError = usePersistedError(loading, error)

  // TokenProjects returns tokens on every network, so filter out native assets that have a
  // bridged version on other networks
  const filteredBaseCurrencyInfos = useMemo(() => {
    return baseCurrencyInfos?.filter((currencyInfo) => {
      if (currencyInfo.currency.isNative) {
        return true
      }

      const { address } = currencyInfo.currency
      const bridgedAsset = BRIDGED_BASE_ADDRESSES.find((bridgedAddress) => areAddressesEqual(bridgedAddress, address))

      if (!bridgedAsset) {
        return true
      }

      return false
    })
  }, [baseCurrencyInfos])

  return { data: filteredBaseCurrencyInfos, loading, error: persistedError, refetch }
}

export function useFavoriteCurrencies(): GqlResult<CurrencyInfo[]> {
  const favoriteCurrencyIds = useAppSelector(selectFavoriteTokens)
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

export function useFilterCallbacks(
  chainId: UniverseChainId | null,
  flow: TokenSelectorFlow,
): {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  onChangeChainFilter: (newChainFilter: UniverseChainId | null) => void
  onClearSearchFilter: () => void
  onChangeText: (newSearchFilter: string) => void
} {
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback(
    (newChainFilter: typeof chainFilter) => {
      setChainFilter(newChainFilter)
      sendAnalyticsEvent(WalletEventName.NetworkFilterSelected, {
        chain: newChainFilter ?? 'All',
        modal: flowToModalName(flow),
      })
    },
    [flow],
  )

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback((newSearchFilter: string) => setSearchFilter(newSearchFilter), [setSearchFilter])

  return {
    chainFilter,
    searchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}

export function useCurrencyInfosToTokenOptions({
  currencyInfos,
  portfolioBalancesById,
  sortAlphabetically,
}: {
  currencyInfos?: CurrencyInfo[]
  sortAlphabetically?: boolean
  portfolioBalancesById?: Record<string, PortfolioBalance>
}): TokenOption[] | undefined {
  // we use useMemo here to avoid recalculation of internals when function params are the same,
  // but the component, where this hook is used is re-rendered
  return useMemo(() => {
    if (!currencyInfos) {
      return undefined
    }
    const sortedCurrencyInfos = sortAlphabetically
      ? [...currencyInfos].sort((a, b) => {
          if (a.currency.name && b.currency.name) {
            return a.currency.name.localeCompare(b.currency.name)
          }
          return 0
        })
      : currencyInfos

    return sortedCurrencyInfos.map(
      (currencyInfo) => portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo),
    )
  }, [currencyInfos, portfolioBalancesById, sortAlphabetically])
}

export function usePortfolioBalancesForAddressById(
  address: Address,
): GqlResult<Record<Address, PortfolioBalance> | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalances({
    address,
    fetchPolicy: 'cache-first', // we want to avoid re-renders when token selector is opening
  })

  return {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  }
}

export function usePortfolioTokenOptions(
  address: Address,
  chainFilter: UniverseChainId | null,
  searchFilter?: string,
): GqlResult<TokenOption[] | undefined> {
  const { data: portfolioBalancesById, error, refetch, loading } = usePortfolioBalancesForAddressById(address)

  const { shownTokens } = useTokenBalancesGroupedByVisibility({
    balancesById: portfolioBalancesById,
  })

  const portfolioBalances = useMemo(() => (shownTokens ? sortPortfolioBalances(shownTokens) : undefined), [shownTokens])

  const filteredPortfolioBalances = useMemo(
    () => portfolioBalances && filter(portfolioBalances, chainFilter, searchFilter),
    [chainFilter, portfolioBalances, searchFilter],
  )

  return {
    data: filteredPortfolioBalances,
    error,
    refetch,
    loading,
  }
}

export function usePopularTokensOptions(
  address: Address,
  chainFilter: UniverseChainId,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: popularTokens,
    error: popularTokensError,
    refetch: refetchPopularTokens,
    loading: loadingPopularTokens,
  } = usePopularTokens(chainFilter)

  const popularTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: popularTokens,
    portfolioBalancesById,
    sortAlphabetically: true,
  })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchPopularTokens?.()
  }, [portfolioBalancesByIdRefetch, refetchPopularTokens])

  const error = (!portfolioBalancesById && portfolioBalancesByIdError) || (!popularTokenOptions && popularTokensError)

  return {
    data: popularTokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingPopularTokens,
  }
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

export function useCommonTokensOptions(
  address: Address,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: commonBaseCurrencies,
    error: commonBaseCurrenciesError,
    refetch: refetchCommonBaseCurrencies,
    loading: loadingCommonBaseCurrencies,
  } = useAllCommonBaseCurrencies()

  const commonBaseTokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: commonBaseCurrencies,
    portfolioBalancesById,
  })

  const refetch = useCallback(() => {
    portfolioBalancesByIdRefetch?.()
    refetchCommonBaseCurrencies?.()
  }, [portfolioBalancesByIdRefetch, refetchCommonBaseCurrencies])

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) || (!commonBaseCurrencies && commonBaseCurrenciesError)

  const filteredCommonBaseTokenOptions = useMemo(
    () => commonBaseTokenOptions && filter(commonBaseTokenOptions, chainFilter),
    [chainFilter, commonBaseTokenOptions],
  )

  return {
    data: filteredCommonBaseTokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingCommonBaseCurrencies,
  }
}

export function useFavoriteTokensOptions(
  address: Address,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address)

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

function searchResultToCurrencyInfo({
  chainId,
  address,
  symbol,
  name,
  logoUrl,
  safetyLevel,
}: TokenSearchResult): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId,
    address,
    decimals: 0, // this does not matter in a context of CurrencyInfo here, as we do not provide any balance
    symbol,
    name,
  })

  if (!currency) {
    return null
  }

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl,
    safetyLevel: safetyLevel ?? SafetyLevel.StrongWarning,
    // defaulting to not spam, as user has searched and chosen this token before
    isSpam: false,
  }
  return currencyInfo
}

function currencyInfosToTokenOptions(currencyInfos: Array<CurrencyInfo | null> | undefined): TokenOption[] | undefined {
  return currencyInfos
    ?.filter((cI): cI is CurrencyInfo => Boolean(cI))
    .map((currencyInfo) => ({
      currencyInfo,
      quantity: null,
      balanceUSD: undefined,
    }))
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

  const searchHistory = useAppSelector(selectSearchHistory)

  // it's a depenedency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  const sections = useMemo(
    () => [
      ...(getTokenOptionsSection(
        t('tokens.selector.section.recent'),
        currencyInfosToTokenOptions(
          searchHistory
            .filter((searchResult): searchResult is TokenSearchResult => searchResult.type === SearchResultType.Token)
            .map(searchResultToCurrencyInfo),
        ),
        <ClearAll onPress={onPressClearSearchHistory} />,
      ) ?? []),
      ...(getTokenOptionsSection(
        t('tokens.selector.section.popular'),
        currencyInfosToTokenOptions(popularTokens?.map(gqlTokenToCurrencyInfo)),
      ) ?? []),
    ],
    [onPressClearSearchHistory, popularTokens, searchHistory, t],
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
    }),
    [loading, sections],
  )
}

export function useTokenSectionsForSearchResults(
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
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
    portfolioTokenOptionsLoading || portfolioBalancesByIdLoading || (!isBalancesOnlySearch && searchTokensLoading)

  const sections = useMemo(
    () =>
      getTokenOptionsSection(
        t('tokens.selector.section.search'),
        // Use local search when only searching balances
        isBalancesOnlySearch ? portfolioTokenOptions : searchResults,
      ),
    [isBalancesOnlySearch, portfolioTokenOptions, searchResults, t],
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
    [error, loading, refetchAll, sections],
  )
}
