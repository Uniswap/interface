import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePoolSearchResultsToPoolOptions } from 'uniswap/src/components/lists/items/pools/usePoolSearchResultsToPoolOptions'
import {
  NFTCollectionOption,
  OnchainItemListOptionType,
  PoolOption,
  SearchModalOption,
  TokenOption,
  WalletByAddressOption,
  WalletOption,
} from 'uniswap/src/components/lists/items/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import {
  SearchResult,
  isEtherscanSearchResult,
  isNFTCollectionSearchResult,
  isPoolSearchResult,
  isTokenSearchResult,
  isWalletSearchResult,
} from 'uniswap/src/features/search/SearchResult'
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
          return isTokenSearchResult(searchResult)
        case SearchTab.Pools:
          return isPoolSearchResult(searchResult)
        case SearchTab.Wallets:
          return isWalletSearchResult(searchResult)
        case SearchTab.NFTCollections:
          return isNFTCollectionSearchResult(searchResult)
        default:
        case SearchTab.All:
          return isMobileApp
            ? isTokenSearchResult(searchResult) ||
                isWalletSearchResult(searchResult) ||
                isNFTCollectionSearchResult(searchResult)
            : isTokenSearchResult(searchResult) || isPoolSearchResult(searchResult)
      }
    })
    .filter((searchResult) => {
      return (
        isWalletSearchResult(searchResult) ||
        isEtherscanSearchResult(searchResult) ||
        (chainFilter ? searchResult.chainId === chainFilter : true)
      )
    })
    .slice(0, numberOfRecentSearchResults)

  // Fetch updated currencyInfos for each recent token search result
  // Token info may change since last stored in redux (protectionInfo/feeData/logoUrl/etc), so we should refetch currencyInfos from saved chain+address. See WEB-6283
  const currencyIds = recentHistory.filter(isTokenSearchResult).map((searchResult) => {
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
  const poolOptions = usePoolSearchResultsToPoolOptions(recentHistory.filter(isPoolSearchResult))

  const walletOptions = recentHistory
    .filter((result) => isWalletSearchResult(result))
    .map(
      (searchResult) =>
        ({
          ...searchResult,
          type: OnchainItemListOptionType.WalletByAddress,
        }) as WalletByAddressOption,
    )

  const nftOptions: NFTCollectionOption[] = recentHistory.filter(isNFTCollectionSearchResult).map((searchResult) => ({
    ...searchResult,
    type: OnchainItemListOptionType.NFTCollection,
  }))

  return useMemo(() => {
    /** If we only have 1 asset type, we can return the Options directly */
    if (recentHistory.every(isTokenSearchResult)) {
      return tokenOptions ?? []
    } else if (recentHistory.every(isPoolSearchResult)) {
      return poolOptions
    } else if (recentHistory.every(isWalletSearchResult)) {
      return walletOptions
    } else if (recentHistory.every(isNFTCollectionSearchResult)) {
      return nftOptions
    }

    /** Otherwise need to re-order our optionItems to match the original recentHistory order: */
    const tokenOptionsMap: { [key: string]: TokenOption } = {}
    tokenOptions?.forEach((option) => {
      tokenOptionsMap[currencyId(option.currencyInfo.currency).toLowerCase()] = option
    })

    const poolOptionsMap: { [key: string]: PoolOption } = {}
    poolOptions.forEach((option) => {
      poolOptionsMap[`${option.chainId}-${option.poolId.toLowerCase()}`] = option
    })

    const walletOptionsMap: { [key: string]: WalletOption } = {}
    walletOptions.forEach((option) => {
      walletOptionsMap[option.address.toLowerCase()] = option
    })

    const nftOptionsMap: { [key: string]: NFTCollectionOption } = {}
    nftOptions.forEach((option) => {
      nftOptionsMap[option.address.toLowerCase()] = option
    })

    const data: SearchModalOption[] = []
    recentHistory.forEach((asset: SearchResult) => {
      if (isTokenSearchResult(asset)) {
        const option =
          tokenOptionsMap[
            buildCurrencyId(asset.chainId, asset.address ?? getNativeAddress(asset.chainId)).toLowerCase()
          ]
        option && data.push(option)
      } else if (isPoolSearchResult(asset)) {
        const option = poolOptionsMap[`${asset.chainId}-${asset.poolId.toLowerCase()}`]
        option && data.push(option)
      } else if (isWalletSearchResult(asset)) {
        const option = walletOptionsMap[asset.address.toLowerCase()]
        option && data.push(option)
      } else if (isNFTCollectionSearchResult(asset)) {
        const option = nftOptionsMap[asset.address.toLowerCase()]
        option && data.push(option)
      }
    })

    return data
  }, [recentHistory, tokenOptions, poolOptions, walletOptions, nftOptions])
}
