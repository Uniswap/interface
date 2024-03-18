import { useCallback, useEffect, useMemo, useState } from 'react'
import { GqlResult } from 'uniswap/src/data/types'
import { filter } from 'wallet/src/components/TokenSelector/filter'
import { flowToModalName } from 'wallet/src/components/TokenSelector/flowToModalName'
import { TokenOption } from 'wallet/src/components/TokenSelector/types'
import { createEmptyBalanceOption } from 'wallet/src/components/TokenSelector/utils'
import { BRIDGED_BASE_ADDRESSES } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, USDC, USDT, WBTC } from 'wallet/src/constants/tokens'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'wallet/src/features/dataApi/balances'
import { useTokenProjects } from 'wallet/src/features/dataApi/tokenProjects'
import { usePopularTokens } from 'wallet/src/features/dataApi/topTokens'
import { CurrencyInfo, PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { usePersistedError } from 'wallet/src/features/dataApi/utils'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { useAppSelector } from 'wallet/src/state'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { WalletEventName } from 'wallet/src/telemetry/constants'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyId,
} from 'wallet/src/utils/currencyId'

// Use Mainnet base token addresses since TokenProjects query returns each token
// on each network
const baseCurrencyIds = [
  buildNativeCurrencyId(ChainId.Mainnet),
  buildNativeCurrencyId(ChainId.Polygon),
  buildNativeCurrencyId(ChainId.Bnb),
  currencyId(DAI),
  currencyId(USDC),
  currencyId(USDT),
  currencyId(WBTC),
  buildWrappedNativeCurrencyId(ChainId.Mainnet),
]

export function useAllCommonBaseCurrencies(): GqlResult<CurrencyInfo[]> {
  const { data: baseCurrencyInfos, loading, error, refetch } = useTokenProjects(baseCurrencyIds)
  const persistedError = usePersistedError(loading, error)

  // TokenProjects returns tokens on every network, so filter out native assets that have a
  // bridged version on other networks
  const filteredBaseCurrencyInfos = useMemo(() => {
    return baseCurrencyInfos?.filter((currencyInfo) => {
      if (currencyInfo.currency.isNative) {
        return true
      }

      const { address } = currencyInfo.currency
      const bridgedAsset = BRIDGED_BASE_ADDRESSES.find((bridgedAddress) =>
        areAddressesEqual(bridgedAddress, address)
      )

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
  const {
    data: favoriteTokensOnAllChains,
    loading,
    error,
    refetch,
  } = useTokenProjects(favoriteCurrencyIds)

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
    [favoriteCurrencyIds, favoriteTokensOnAllChains]
  )

  return { data: favoriteTokens, loading, error: persistedError, refetch }
}

export function useFilterCallbacks(
  chainId: ChainId | null,
  flow: TokenSelectorFlow
): {
  chainFilter: ChainId | null
  searchFilter: string | null
  onChangeChainFilter: (newChainFilter: ChainId | null) => void
  onClearSearchFilter: () => void
  onChangeText: (newSearchFilter: string) => void
} {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback(
    (newChainFilter: typeof chainFilter) => {
      setChainFilter(newChainFilter)
      sendWalletAnalyticsEvent(WalletEventName.NetworkFilterSelected, {
        chain: newChainFilter ?? 'All',
        modal: flowToModalName(flow),
      })
    },
    [flow]
  )

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback(
    (newSearchFilter: string) => setSearchFilter(newSearchFilter),
    [setSearchFilter]
  )

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
      (currencyInfo) =>
        portfolioBalancesById?.[currencyInfo.currencyId] ?? createEmptyBalanceOption(currencyInfo)
    )
  }, [currencyInfos, portfolioBalancesById, sortAlphabetically])
}

export function usePortfolioBalancesForAddressById(
  address: Address
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
  chainFilter: ChainId | null,
  searchFilter?: string
): GqlResult<TokenOption[] | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalancesForAddressById(address)

  const { shownTokens } = useTokenBalancesGroupedByVisibility({
    balancesById: portfolioBalancesById,
  })

  const portfolioBalances = useMemo(
    () => (shownTokens ? sortPortfolioBalances(shownTokens) : undefined),
    [shownTokens]
  )

  const filteredPortfolioBalances = useMemo(
    () => portfolioBalances && filter(portfolioBalances, chainFilter, searchFilter),
    [chainFilter, portfolioBalances, searchFilter]
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
  chainFilter: ChainId
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

  const error =
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!popularTokenOptions && popularTokensError)

  return {
    data: popularTokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingPopularTokens,
  }
}

export function useCommonTokensOptions(
  address: Address,
  chainFilter: ChainId | null
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
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!commonBaseCurrencies && commonBaseCurrenciesError)

  const filteredCommonBaseTokenOptions = useMemo(
    () => commonBaseTokenOptions && filter(commonBaseTokenOptions, chainFilter),
    [chainFilter, commonBaseTokenOptions]
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
  chainFilter: ChainId | null
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
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!favoriteCurrencies && favoriteCurrenciesError)

  const filteredFavoriteTokenOptions = useMemo(
    () => favoriteTokenOptions && filter(favoriteTokenOptions, chainFilter),
    [chainFilter, favoriteTokenOptions]
  )

  return {
    data: filteredFavoriteTokenOptions,
    refetch,
    error: error || undefined,
    loading: loadingPorfolioBalancesById || loadingFavoriteCurrencies,
  }
}
