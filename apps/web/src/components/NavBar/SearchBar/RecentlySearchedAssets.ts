import { chainIdToBackendChain } from 'constants/chains'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { GenieCollection } from 'nft/types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { MAX_RECENT_SEARCH_RESULTS } from 'uniswap/src/components/TokenSelector/hooks'
import {
  Chain,
  NftCollection,
  useRecentlySearchedAssetsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  SearchResult,
  isNFTCollectionSearchResult,
  isTokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

export type InterfaceRemoteSearchHistoryItem = GqlSearchToken | GenieCollection

export function useRecentlySearchedAssets(): { data?: InterfaceRemoteSearchHistoryItem[]; loading: boolean } {
  const history = useSelector(selectSearchHistory)
  const shortenedHistory = useMemo(() => history.slice(0, MAX_RECENT_SEARCH_RESULTS), [history])

  const { data: queryData, loading } = useRecentlySearchedAssetsQuery({
    variables: {
      collectionAddresses: shortenedHistory.filter(isNFTCollectionSearchResult).map((asset) => asset.address),
      contracts: shortenedHistory.filter(isTokenSearchResult).map((token) => ({
        address: token.address ?? undefined,
        chain: chainIdToBackendChain({ chainId: token.chainId }),
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
    // Collects both tokens and collections in a map, so they can later be returned in original order
    const resultsMap: { [key: string]: InterfaceRemoteSearchHistoryItem } = {}

    const queryCollections = queryData?.nftCollections?.edges.map((edge) => edge.node as NonNullable<NftCollection>)
    const collections = queryCollections?.map(
      (queryCollection): GenieCollection => {
        return {
          address: queryCollection.nftContracts?.[0]?.address ?? '',
          isVerified: queryCollection?.isVerified,
          name: queryCollection?.name,
          stats: {
            floor_price: queryCollection?.markets?.[0]?.floorPrice?.value,
            total_supply: queryCollection?.numAssets,
          },
          imageUrl: queryCollection?.image?.url ?? '',
        }
      },
      [queryCollections],
    )
    collections?.forEach((collection) => (resultsMap[collection.address] = collection))
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
  if (isNFTCollectionSearchResult(asset)) {
    return resultsMap[asset.address]
  }

  if (!isTokenSearchResult(asset)) {
    return undefined
  }

  if (!isNativeCurrencyAddress(asset.chainId, asset.address) && asset.address) {
    return resultsMap[asset.address]
  }

  // Handle native assets
  if (isNativeCurrencyAddress(asset.chainId, asset.address)) {
    // Handles special case where wMATIC data needs to be used for MATIC
    const chain = chainIdToBackendChain({ chainId: asset.chainId })
    if (!chain) {
      logger.error(new Error('Invalid chain retrieved from Search Token/Collection Query'), {
        tags: {
          file: 'RecentlySearchedAssets',
          function: 'useRecentlySearchedAssets',
        },
        extra: { asset },
      })
      return undefined
    }
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
