import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import {
  NFTCollectionOption,
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
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  isEtherscanSearchHistoryResult,
  isNFTCollectionSearchHistoryResult,
  isPoolSearchHistoryResult,
  isTokenSearchHistoryResult,
  isWalletSearchHistoryResult,
  SearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId, buildNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { isMobileApp } from 'utilities/src/platform'

export function useRecentlySearchedOptions({
  chainFilter,
  activeTab,
  numberOfRecentSearchResults = MAX_RECENT_SEARCH_RESULTS,
}: {
  chainFilter: UniverseChainId | null
  activeTab: SearchTab
  numberOfRecentSearchResults: number
}): SearchModalOption[] {
  const recentHistory = useSelector(selectSearchHistory)
    .filter((searchResult) => {
      switch (activeTab) {
        case SearchTab.Tokens:
          return isTokenSearchHistoryResult(searchResult)
        case SearchTab.Pools:
          return isPoolSearchHistoryResult(searchResult)
        case SearchTab.Wallets:
          return isWalletSearchHistoryResult(searchResult)
        case SearchTab.NFTCollections:
          return isNFTCollectionSearchHistoryResult(searchResult)
        default:
        case SearchTab.All:
          return isMobileApp
            ? isTokenSearchHistoryResult(searchResult) ||
                isWalletSearchHistoryResult(searchResult) ||
                isNFTCollectionSearchHistoryResult(searchResult)
            : isTokenSearchHistoryResult(searchResult) || isPoolSearchHistoryResult(searchResult)
      }
    })
    .filter((searchResult) => {
      return (
        isWalletSearchHistoryResult(searchResult) ||
        isEtherscanSearchHistoryResult(searchResult) ||
        (chainFilter ? searchResult.chainId === chainFilter : true)
      )
    })
    .slice(0, numberOfRecentSearchResults)

  // Fetch updated currencyInfos for each recent token search result
  // Token info may change since last stored in redux (protectionInfo/feeData/logoUrl/etc), so we should refetch currencyInfos from saved chain+address. See PORT-419
  const currencyIds = recentHistory.filter(isTokenSearchHistoryResult).map((searchResult) => {
    const id = searchResult.address
      ? buildCurrencyId(searchResult.chainId, searchResult.address)
      : buildNativeCurrencyId(searchResult.chainId)
    return id
  })
  const tokenCurrencyInfos = useCurrencyInfos(currencyIds)
  const tokenOptions = useCurrencyInfosToTokenOptions({
    currencyInfos: tokenCurrencyInfos.filter((info): info is CurrencyInfo => info !== undefined),
  })

  // Get pool options
  const poolOptions = usePoolSearchResultsToPoolOptions(recentHistory.filter(isPoolSearchHistoryResult))

  const walletOptions: WalletByAddressOption[] = recentHistory
    .filter(isWalletSearchHistoryResult)
    .map((searchResult) => ({
      ...searchResult,
      type: OnchainItemListOptionType.WalletByAddress,
    }))

  const nftOptions: NFTCollectionOption[] = recentHistory
    .filter(isNFTCollectionSearchHistoryResult)
    .map((searchResult) => ({
      ...searchResult,
      type: OnchainItemListOptionType.NFTCollection,
    }))

  return useMemo(() => {
    /** If we only have 1 asset type, we can return the Options directly */
    if (recentHistory.every(isTokenSearchHistoryResult)) {
      return tokenOptions ?? []
    } else if (recentHistory.every(isPoolSearchHistoryResult)) {
      return poolOptions
    } else if (recentHistory.every(isWalletSearchHistoryResult)) {
      return walletOptions
    } else if (recentHistory.every(isNFTCollectionSearchHistoryResult)) {
      return nftOptions
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

    const nftOptionsMap: { [key: string]: NFTCollectionOption } = {}
    nftOptions.forEach((option) => {
      nftOptionsMap[normalizeTokenAddressForCache(option.address)] = option
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
      } else if (isWalletSearchHistoryResult(asset)) {
        const option = walletOptionsMap[normalizeTokenAddressForCache(asset.address)]
        option && data.push(option)
      } else if (isNFTCollectionSearchHistoryResult(asset)) {
        const option = nftOptionsMap[normalizeTokenAddressForCache(asset.address)]
        option && data.push(option)
      }
    })

    return data
  }, [recentHistory, tokenOptions, poolOptions, walletOptions, nftOptions])
}
