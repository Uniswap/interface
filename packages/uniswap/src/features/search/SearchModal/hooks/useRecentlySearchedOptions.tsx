import { isMobileApp, isWebApp } from '@universe/environment'
import { useMemo } from 'react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import {
  MultichainTokenOption,
  OnchainItemListOptionType,
  PoolOption,
  SearchModalOption,
  TokenOption,
  WalletByAddressOption,
} from 'uniswap/src/components/lists/items/types'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, MultichainSearchResult, SearchMultichainParent } from 'uniswap/src/features/dataApi/types'
import {
  isEtherscanSearchHistoryResult,
  isMultichainTokenSearchHistoryResult,
  isPoolSearchHistoryResult,
  isTokenSearchHistoryResult,
  isWalletSearchHistoryResult,
  MultichainTokenSearchHistoryResult,
  SearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { dedupeCurrencyIds } from 'uniswap/src/features/search/SearchModal/utils/dedupeCurrencyIds'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId, currencyId, currencyIdToChain } from 'uniswap/src/utils/currencyId'

function multichainHistoryToTokenOption(
  history: MultichainTokenSearchHistoryResult,
  currencyInfoById: Map<string, CurrencyInfo>,
): MultichainTokenOption | undefined {
  const tokens: CurrencyInfo[] = []
  for (const id of history.tokenCurrencyIds) {
    const info = currencyInfoById.get(normalizeCurrencyIdForMapLookup(id))
    if (info) {
      tokens.push(info)
    }
  }
  const primaryCurrencyInfo = tokens[0]
  if (!primaryCurrencyInfo) {
    return undefined
  }
  // Use history.tokenCurrencyIds (the full saved list) so multichain detection
  // works even when some chain tokens haven't been loaded into the cache yet.
  const searchMultichainParent: SearchMultichainParent = {
    id: history.multichainId,
    tokenCurrencyIds: history.tokenCurrencyIds,
  }
  const multichainResult: MultichainSearchResult = {
    id: history.multichainId,
    name: history.name,
    symbol: history.symbol,
    logoUrl: history.logoUrl,
    tokens: tokens.map((t) => ({ ...t, searchMultichainParent })),
    safetyInfo: primaryCurrencyInfo.safetyInfo,
  }
  return {
    type: OnchainItemListOptionType.MultichainToken,
    multichainResult,
    primaryCurrencyInfo: { ...primaryCurrencyInfo, searchMultichainParent },
    ...(history.tdpChainFilter != null ? { tdpChainFilter: history.tdpChainFilter } : {}),
  }
}

export function useRecentlySearchedOptions({
  chainFilter,
  activeTab,
  numberOfRecentSearchResults = MAX_RECENT_SEARCH_RESULTS,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  numberOfRecentSearchResults: number
}): SearchModalOption[] {
  // Snapshot the search history when the modal opens to prevent a layout shift due to modifier-clicks (web only).
  const liveHistory = useSelector(selectSearchHistory)
  const [snapshot, setSnapshot] = useState(liveHistory)

  if (liveHistory.length === 0 && snapshot.length > 0) {
    setSnapshot(liveHistory)
  }

  const history = isWebApp ? snapshot : liveHistory

  const recentHistory = history
    .filter((searchResult) => {
      switch (activeTab) {
        case SearchTab.Tokens:
          return isTokenSearchHistoryResult(searchResult) || isMultichainTokenSearchHistoryResult(searchResult)
        case SearchTab.Pools:
          return isPoolSearchHistoryResult(searchResult)
        case SearchTab.Wallets:
          return isWalletSearchHistoryResult(searchResult)
        case SearchTab.Auctions:
          return false // Auctions don't have search history yet
        default:
        case SearchTab.All:
          if (isMobileApp) {
            return (
              isTokenSearchHistoryResult(searchResult) ||
              isMultichainTokenSearchHistoryResult(searchResult) ||
              isWalletSearchHistoryResult(searchResult)
            )
          }
          // Web platform
          return (
            isTokenSearchHistoryResult(searchResult) ||
            isMultichainTokenSearchHistoryResult(searchResult) ||
            isPoolSearchHistoryResult(searchResult) ||
            (isWebApp && isWalletSearchHistoryResult(searchResult))
          )
      }
    })
    .filter((searchResult) => {
      if (isWalletSearchHistoryResult(searchResult) || isEtherscanSearchHistoryResult(searchResult)) {
        return true
      }
      if (!chainFilter) {
        return true
      }
      if (isMultichainTokenSearchHistoryResult(searchResult)) {
        return searchResult.tokenCurrencyIds.some((id) => currencyIdToChain(id) === chainFilter)
      }
      if (isTokenSearchHistoryResult(searchResult) || isPoolSearchHistoryResult(searchResult)) {
        return searchResult.chainId === chainFilter
      }
      return true
    })
    .slice(0, numberOfRecentSearchResults)

  // Fetch updated currencyInfos for each recent token + multichain token search result
  // Token info may change since last stored in redux (protectionInfo/feeData/logoUrl/etc),
  // so we should refetch currencyInfos from saved chain+address. See CONS-419
  const tokenHistoryCurrencyIds = recentHistory.filter(isTokenSearchHistoryResult).map((searchResult) => {
    const id = searchResult.address
      ? buildCurrencyId(searchResult.chainId, searchResult.address)
      : buildNativeCurrencyId(searchResult.chainId)
    return id
  })
  const multichainHistoryCurrencyIds = recentHistory
    .filter(isMultichainTokenSearchHistoryResult)
    .flatMap((r) => r.tokenCurrencyIds)

  const allCurrencyIds = dedupeCurrencyIds([...tokenHistoryCurrencyIds, ...multichainHistoryCurrencyIds])
  const tokenCurrencyInfos = useCurrencyInfos(allCurrencyIds)

  const currencyInfoById = useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (const info of tokenCurrencyInfos) {
      if (info) {
        map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }
    return map
  }, [tokenCurrencyInfos])

  const tokenCurrencyInfosForOptions = tokenHistoryCurrencyIds
    .map((id) => currencyInfoById.get(normalizeCurrencyIdForMapLookup(id)))
    .filter((info): info is CurrencyInfo => info !== undefined)

  const tokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: tokenCurrencyInfosForOptions,
  })

  // Get pool options
  const poolOptions = usePoolSearchResultsToPoolOptions(recentHistory.filter(isPoolSearchHistoryResult))

  const walletOptions: WalletByAddressOption[] = recentHistory
    .filter(isWalletSearchHistoryResult)
    .map((searchResult) => ({
      ...searchResult,
      type: OnchainItemListOptionType.WalletByAddress,
    }))

  return useMemo(() => {
    /** If we only have 1 asset type, we can return the Options directly */
    if (recentHistory.every(isTokenSearchHistoryResult)) {
      return tokenOptions ?? []
    } else if (recentHistory.every(isPoolSearchHistoryResult)) {
      return poolOptions
    } else if (recentHistory.every(isWalletSearchHistoryResult)) {
      return walletOptions
    }

    /** Otherwise need to re-order our optionItems to match the original recentHistory order: */
    const tokenOptionsMap: { [key: string]: TokenOption } = {}
    tokenOptions?.forEach((option) => {
      tokenOptionsMap[normalizeCurrencyIdForMapLookup(currencyId(option.currencyInfo.currency))] = option
    })

    const poolOptionsMap: { [key: string]: PoolOption } = {}
    poolOptions.forEach((option) => {
      poolOptionsMap[`${option.chainId}-${normalizeTokenAddressForCache(option.poolId)}`] = option
    })

    const walletOptionsMap: { [key: string]: WalletByAddressOption } = {}
    walletOptions.forEach((option) => {
      walletOptionsMap[normalizeTokenAddressForCache(option.address)] = option
    })

    const data: SearchModalOption[] = []
    recentHistory.forEach((asset: SearchHistoryResult) => {
      if (isTokenSearchHistoryResult(asset)) {
        const option =
          tokenOptionsMap[
            normalizeCurrencyIdForMapLookup(
              buildCurrencyId(asset.chainId, asset.address ?? getNativeAddress(asset.chainId)),
            )
          ]
        option && data.push(option)
      } else if (isPoolSearchHistoryResult(asset)) {
        const option = poolOptionsMap[`${asset.chainId}-${normalizeTokenAddressForCache(asset.poolId)}`]
        option && data.push(option)
      } else if (isMultichainTokenSearchHistoryResult(asset)) {
        const option = multichainHistoryToTokenOption(asset, currencyInfoById)
        option && data.push(option)
      } else if (isWalletSearchHistoryResult(asset)) {
        const option = walletOptionsMap[normalizeTokenAddressForCache(asset.address)]
        option && data.push(option)
      }
    })

    return data
  }, [recentHistory, tokenOptions, poolOptions, walletOptions, currencyInfoById])
}
