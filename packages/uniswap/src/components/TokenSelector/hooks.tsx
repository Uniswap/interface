/* eslint-disable max-lines */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Text, TouchableArea } from 'ui/src'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/flowToModalName'
import {
  TokenOption,
  TokenOptionSection,
  TokenSection,
  TokenSelectorFlow,
} from 'uniswap/src/components/TokenSelector/types'
import {
  createEmptyBalanceOption,
  formatSearchResults,
  useTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { BRIDGED_BASE_ADDRESSES, getNativeAddress } from 'uniswap/src/constants/addresses'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { DAI, USDC, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { usePopularTokens as usePopularTokensGql } from 'uniswap/src/features/dataApi/topTokens'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, gqlTokenToCurrencyInfo, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { addToSearchHistory, clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { usePopularTokens } from 'uniswap/src/features/tokens/hooks'
import {
  UniverseChainId,
  WALLET_SUPPORTED_CHAIN_IDS,
  WEB_SUPPORTED_CHAIN_IDS,
  WalletChainId,
} from 'uniswap/src/types/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildNativeCurrencyId, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { isInterface } from 'utilities/src/platform'

const nativeCurrencyNames = (isInterface ? WEB_SUPPORTED_CHAIN_IDS : WALLET_SUPPORTED_CHAIN_IDS)
  .map((chainId) => {
    return UNIVERSE_CHAIN_INFO[chainId].testnet
      ? false
      : {
          chainId,
          name: UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.name.toLowerCase(),
        }
  })
  .filter(Boolean) as { chainId: WalletChainId; name: string }[]

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

export function currencyInfosToTokenOptions(
  currencyInfos: Array<CurrencyInfo | null> | undefined,
): TokenOption[] | undefined {
  return currencyInfos
    ?.filter((cI): cI is CurrencyInfo => Boolean(cI))
    .map((currencyInfo) => ({
      currencyInfo,
      quantity: null,
      balanceUSD: undefined,
    }))
}

export function searchResultToCurrencyInfo({
  chainId,
  address,
  symbol,
  name,
  logoUrl,
  safetyLevel,
  safetyInfo,
}: TokenSearchResult): CurrencyInfo | null {
  const currency = buildCurrency({
    chainId: chainId as WalletChainId,
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
    safetyInfo,
  }
  return currencyInfo
}

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

export function usePortfolioBalancesForAddressById(
  address: Address | undefined,
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
    dispatch(
      addToSearchHistory({
        searchResult: currencyInfoToTokenSearchResult(currencyInfo),
      }),
    )
  }

  return { registerSearch }
}

function currencyInfoToTokenSearchResult(currencyInfo: CurrencyInfo): TokenSearchResult {
  const address = currencyInfo.currency.isToken
    ? currencyInfo.currency.address
    : getNativeAddress(currencyInfo.currency.chainId)

  return {
    type: SearchResultType.Token,
    chainId: currencyInfo.currency.chainId,
    address: tokenAddressOrNativeAddress(address, currencyInfo.currency.chainId),
    name: currencyInfo.currency.name ?? null,
    symbol: currencyInfo.currency.symbol ?? '',
    logoUrl: currencyInfo.logoUrl ?? null,
    safetyLevel: currencyInfo.safetyLevel ?? null,
    safetyInfo: currencyInfo.safetyInfo,
  }
}

export function useFavoriteTokensOptions(
  address: Address | undefined,
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

export function useTokenSectionsForEmptySearch(chainFilter: UniverseChainId | null): GqlResult<TokenSection[]> {
  const dispatch = useDispatch()

  const { popularTokens, loading } = usePopularTokens()

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  // it's a dependency of useMemo => useCallback
  const onPressClearSearchHistory = useCallback((): void => {
    dispatch(clearSearchHistory())
  }, [dispatch])

  const recentSection = useTokenOptionsSection(
    TokenOptionSection.RecentTokens,
    recentlySearchedTokenOptions,
    <ClearAll onPress={onPressClearSearchHistory} />,
  )
  const popularSection = useTokenOptionsSection(
    TokenOptionSection.PopularTokens,
    currencyInfosToTokenOptions(popularTokens?.map(gqlTokenToCurrencyInfo)),
  )
  const sections = useMemo(() => [...(recentSection ?? []), ...(popularSection ?? [])], [popularSection, recentSection])

  return useMemo(
    () => ({
      data: sections,
      loading,
    }),
    [loading, sections],
  )
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

function useCommonTokensOptions(
  address: Address | undefined,
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

export function useCommonTokensOptionsWithFallback(
  address: Address | undefined,
  chainFilter: UniverseChainId | null,
): GqlResult<TokenOption[] | undefined> {
  const { data, error, refetch, loading } = useCommonTokensOptions(address, chainFilter)
  const commonBases = chainFilter ? currencyInfosToTokenOptions(COMMON_BASES[chainFilter]) : undefined

  const shouldFallback = !loading && data?.length === 0 && commonBases?.length

  return {
    data: shouldFallback ? commonBases : data,
    error: shouldFallback ? undefined : error,
    refetch,
    loading,
  }
}

export function usePopularTokensOptions(
  address: Address | undefined,
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
  } = usePopularTokensGql(chainFilter)

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

export function usePortfolioTokenOptions(
  address: Address | undefined,
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

export function useFilterCallbacks(
  chainId: UniverseChainId | null,
  flow: TokenSelectorFlow,
): {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string | null
  parsedSearchFilter: string | null
  onChangeChainFilter: (newChainFilter: UniverseChainId | null) => void
  onClearSearchFilter: () => void
  onChangeText: (newSearchFilter: string) => void
} {
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(chainId)
  const [parsedChainFilter, setParsedChainFilter] = useState<UniverseChainId | null>(null)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)
  const [parsedSearchFilter, setParsedSearchFilter] = useState<string | null>(null)

  // Parses the user input to determine if the user is searching for a chain + token
  // i.e "eth dai"
  // parsedChainFilter: 1
  // parsedSearchFilter: "dai"
  useEffect(() => {
    const splitSearch = searchFilter?.split(' ')
    const maybeChainName = splitSearch?.[0]?.toLowerCase()

    const chainMatch = nativeCurrencyNames.find((currency) => currency.name.startsWith(maybeChainName ?? ''))
    const search = splitSearch?.slice(1).join(' ')

    if (!chainFilter && chainMatch && search) {
      setParsedChainFilter(chainMatch.chainId)
      setParsedSearchFilter(search)
    } else {
      setParsedChainFilter(null)
      setParsedSearchFilter(null)
    }
  }, [searchFilter, chainFilter])

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
    parsedChainFilter,
    searchFilter,
    parsedSearchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}

export const MAX_RECENT_SEARCH_RESULTS = 4

export function useRecentlySearchedTokens(chainFilter: UniverseChainId | null): TokenOption[] | undefined {
  const searchHistory = useSelector(selectSearchHistory)

  return currencyInfosToTokenOptions(
    searchHistory
      .filter((searchResult): searchResult is TokenSearchResult => searchResult.type === SearchResultType.Token)
      .filter((searchResult) => (chainFilter ? searchResult.chainId === chainFilter : true))
      .slice(0, MAX_RECENT_SEARCH_RESULTS)
      .map(searchResultToCurrencyInfo),
  )
}

export function useTokenSectionsForSearchResults(
  address: string | undefined,
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
): GqlResult<TokenSection[]> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(address, chainFilter, searchFilter ?? undefined)

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

  const sections = useTokenOptionsSection(
    TokenOptionSection.SearchResults,
    // Use local search when only searching balances
    isBalancesOnlySearch ? portfolioTokenOptions : searchResults,
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
