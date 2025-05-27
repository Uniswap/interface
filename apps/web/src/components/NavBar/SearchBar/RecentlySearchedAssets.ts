import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { GenieCollection } from 'nft/types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/constants'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Chain,
  useRecentlySearchedAssetsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  SearchResult,
  SearchResultType,
  isNFTCollectionSearchResult,
  isTokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export type InterfaceRemoteSearchHistoryItem = GqlSearchToken | GenieCollection

export function useRecentlySearchedAssets(): { data?: InterfaceRemoteSearchHistoryItem[]; loading: boolean } {
  const history = useSelector(selectSearchHistory)
  const shortenedHistory = useMemo(
    () => history.filter((item) => item.type !== SearchResultType.NFTCollection).slice(0, MAX_RECENT_SEARCH_RESULTS),
    [history],
  )

  const { data: queryData, loading } = useRecentlySearchedAssetsQuery({
    variables: {
      collectionAddresses: shortenedHistory.filter(isNFTCollectionSearchResult).map((asset) => asset.address),
      contracts: shortenedHistory.filter(isTokenSearchResult).map((token) => ({
        address: token.address ?? undefined,
        chain: toGraphQLChain(token.chainId),
      })),
    },
    skip: shortenedHistory.length === 0,
  })

  const data = useMemo((): InterfaceRemoteSearchHistoryItem[] | undefined => {
    if (shortenedHistory.length === 0) {
      return []
    } else if (!queryData) {
      return undefined
    }
    // Collects tokens in a map, so they can later be returned in original order
    const resultsMap: { [key: string]: InterfaceRemoteSearchHistoryItem } = {}
    queryData.tokens?.filter(Boolean).forEach((token) => {
      if (token) {
        resultsMap[token.address ?? getNativeQueryAddress(token.chain)] = token
      }
    })

    const data: InterfaceRemoteSearchHistoryItem[] = []
    shortenedHistory.forEach((asset: SearchResult) => {
      const result = generateInterfaceHistoryItem(asset, resultsMap)
      if (result) {
        data.push(result)
      }
    })
    return data
  }, [queryData, shortenedHistory])

  return { data, loading }
}

function generateInterfaceHistoryItem(
  asset: SearchResult,
  resultsMap: Record<string, InterfaceRemoteSearchHistoryItem>,
): InterfaceRemoteSearchHistoryItem | undefined {
  if (!isTokenSearchResult(asset)) {
    return undefined
  }

  if (!isNativeCurrencyAddress(asset.chainId, asset.address) && asset.address) {
    return resultsMap[asset.address]
  }

  // Handle native assets
  if (isNativeCurrencyAddress(asset.chainId, asset.address)) {
    // Handles special case where wMATIC data needs to be used for MATIC
    const chain = toGraphQLChain(asset.chainId)
    const native = nativeOnChain(asset.chainId)
    const queryAddress = asset.address ?? getNativeQueryAddress(chain)
    const result = resultsMap[queryAddress]
    return { ...result, address: NATIVE_CHAIN_ID, ...native }
  }

  return undefined
}

function getNativeQueryAddress(chain: Chain) {
  return `NATIVE-${chain}`
}
