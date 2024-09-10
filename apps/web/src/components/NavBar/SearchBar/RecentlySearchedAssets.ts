import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { SearchToken, TokenSearchResultWeb } from 'graphql/data/SearchTokens'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { GenieCollection } from 'nft/types'
import { useCallback, useMemo } from 'react'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import {
  Chain,
  NftCollection,
  useRecentlySearchedAssetsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

// Temporary measure used until backend supports addressing by "NATIVE"
const NATIVE_QUERY_ADDRESS_INPUT = null as unknown as string
function getQueryAddress(chain: Chain) {
  return getNativeTokenDBAddress(chain) ?? NATIVE_QUERY_ADDRESS_INPUT
}
function getNativeQueryAddress(chain: Chain) {
  return `NATIVE-${chain}`
}

export const recentlySearchedAssetsAtom = atomWithStorage<TokenSearchResultWeb[]>('recentlySearchedAssetsV3', [])

// Used by TokenSelector
export function useAddRecentlySearchedCurrency() {
  const [searchHistory, updateSearchHistory] = useAtom(recentlySearchedAssetsAtom)

  return useCallback(
    (currencyInfo: CurrencyInfo) => {
      // Removes the new currency if it was already in the array
      const newHistory = searchHistory.filter((oldCurrency) => {
        // Don't filter out NFTs of the same chainId when adding a native token to the search history
        if (oldCurrency.isNft) {
          return true
        }
        // Filter out tokens of the same address and chainId
        if (currencyInfo.currency.isToken) {
          return !(
            oldCurrency.address === currencyInfo.currency.address &&
            oldCurrency.chainId === currencyInfo.currency.chainId
          )
          // Filter out native tokens of the same chainId
        } else {
          return oldCurrency.chainId !== currencyInfo.currency.chainId
        }
      })
      newHistory.unshift({
        type: SearchResultType.Token,
        chain: toGraphQLChain(currencyInfo.currency.chainId) ?? Chain.Ethereum,
        chainId: currencyInfo.currency.chainId,
        address: currencyInfo.currency.isToken
          ? currencyInfo.currency.address
          : UNIVERSE_CHAIN_INFO[currencyInfo.currency.chainId as UniverseChainId].nativeCurrency.address,
        name: currencyInfo.currency.name ?? null,
        symbol: currencyInfo.currency.symbol ?? '',
        logoUrl: currencyInfo.logoUrl ?? null,
        safetyLevel: currencyInfo.safetyLevel ?? null,
        isToken: currencyInfo.currency.isToken,
        isNative: currencyInfo.currency.isNative,
      })
      updateSearchHistory(newHistory)
    },
    [searchHistory, updateSearchHistory],
  )
}

// Used by NavBar
export function useAddRecentlySearchedAsset() {
  const [searchHistory, updateSearchHistory] = useAtom(recentlySearchedAssetsAtom)

  return useCallback(
    (asset: TokenSearchResultWeb) => {
      // Removes the new asset if it was already in the array
      const address = asset.isNative ? UNIVERSE_CHAIN_INFO[asset.chainId].nativeCurrency.address : asset.address
      const newHistory = searchHistory.filter(
        (oldAsset) => !(oldAsset.address === address && oldAsset.chain === asset.chain),
      )
      newHistory.unshift({
        ...asset,
        address,
      })
      updateSearchHistory(newHistory)
    },
    [searchHistory, updateSearchHistory],
  )
}

export function useRecentlySearchedAssets() {
  const history = useAtomValue(recentlySearchedAssetsAtom)
  const shortenedHistory = useMemo(() => history.slice(0, 4), [history])

  const { data: queryData, loading } = useRecentlySearchedAssetsQuery({
    variables: {
      collectionAddresses: shortenedHistory.filter((asset) => asset.isNft).map((asset) => asset.address),
      contracts: shortenedHistory
        .filter((asset) => !asset.isNft)
        .map((token) => ({
          address: token.isNative ? getQueryAddress(token.chain) : token.address,
          chain: token.chain,
        })),
    },
  })

  const data = useMemo(() => {
    if (shortenedHistory.length === 0) {
      return []
    } else if (!queryData) {
      return undefined
    }
    // Collects both tokens and collections in a map, so they can later be returned in original order
    const resultsMap: { [key: string]: GenieCollection | SearchToken } = {}

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

    const data: (SearchToken | GenieCollection)[] = []
    shortenedHistory.forEach((asset) => {
      if (asset.isNative) {
        // Handles special case where wMATIC data needs to be used for MATIC
        const chain = supportedChainIdFromGQLChain(asset.chain)
        if (!chain) {
          logger.error(new Error('Invalid chain retrieved from Search Token/Collection Query'), {
            tags: {
              file: 'RecentlySearchedAssets',
              function: 'useRecentlySearchedAssets',
            },
            extra: { asset },
          })
          return
        }
        const native = nativeOnChain(chain)
        const queryAddress = getQueryAddress(asset.chain)?.toLowerCase() ?? getNativeQueryAddress(asset.chain)
        const result = resultsMap[queryAddress]
        if (result) {
          data.push({ ...result, address: NATIVE_CHAIN_ID, ...native })
        }
      } else {
        const result = resultsMap[asset.address]
        if (result) {
          data.push(result)
        }
      }
    })
    return data
  }, [queryData, shortenedHistory])

  return { data, loading }
}
