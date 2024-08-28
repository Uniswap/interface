import { useCallback, useEffect, useMemo, useState } from 'react'
import { filter } from 'uniswap/src/components/TokenSelector/filter'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/flowToModalName'
import {
  FilterCallbacksHookType,
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
import { BRIDGED_BASE_ADDRESSES } from 'uniswap/src/constants/addresses'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { DAI, USDC, USDT, WBTC } from 'uniswap/src/constants/tokens'
import {
  PortfolioValueModifier,
  SafetyLevel,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects'
import { usePopularTokens } from 'uniswap/src/features/dataApi/topTokens'
import { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrency, usePersistedError } from 'uniswap/src/features/dataApi/utils'
import { SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
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
  valueModifiers?: PortfolioValueModifier[],
): GqlResult<Record<Address, PortfolioBalance> | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalances({
    address,
    fetchPolicy: 'cache-first', // we want to avoid re-renders when token selector is opening
    valueModifiers,
  })

  return {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
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

export function useCommonTokensOptions(
  address: Address | undefined,
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

export function usePopularTokensOptions(
  address: Address | undefined,
  chainFilter: UniverseChainId,
  valueModifiers?: PortfolioValueModifier[],
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: portfolioBalancesByIdRefetch,
    loading: loadingPorfolioBalancesById,
  } = usePortfolioBalancesForAddressById(address, valueModifiers)

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

export function usePortfolioTokenOptions(
  address: Address | undefined,
  chainFilter: UniverseChainId | null,
  valueModifiers?: PortfolioValueModifier[],
  searchFilter?: string,
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalancesForAddressById(address, valueModifiers)

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
): ReturnType<FilterCallbacksHookType> {
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

export function filterRecentlySearchedTokenOptions(
  chainFilter: UniverseChainId | null,
  searchHistory?: TokenSearchResult[],
): TokenOption[] | undefined {
  return currencyInfosToTokenOptions(
    searchHistory
      ?.filter((searchResult): searchResult is TokenSearchResult => searchResult.type === SearchResultType.Token)
      ?.filter((searchResult) => (chainFilter ? searchResult.chainId === chainFilter : true))
      .map(searchResultToCurrencyInfo),
  )
}

export function useTokenSectionsForSearchResults(
  address: string | undefined,
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
  valueModifiers?: PortfolioValueModifier[],
): GqlResult<TokenSection[]> {
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = usePortfolioBalancesForAddressById(address, valueModifiers)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(address, chainFilter, valueModifiers, searchFilter ?? undefined)

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
