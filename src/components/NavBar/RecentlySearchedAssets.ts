import { Chain, NftCollection, useRecentlySearchedAssetsQuery } from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { FungibleToken, GenieCollection, parseFungibleTokens } from 'nft/types'
import { useCallback, useMemo } from 'react'

type RecentlySearchedAsset = {
  isNft: boolean
  address: string
  chain: Chain
}

const recentlySearchedAssetsAtom = atomWithStorage<RecentlySearchedAsset[]>('recentlySearchedAssets', [])

function useAddRecentlySearchedAsset() {
  const [searchHistory, updateSearchHistory] = useAtom(recentlySearchedAssetsAtom)

  return useCallback(
    (asset: FungibleToken | GenieCollection, isNft: boolean, chain: Chain) => {
      // Removes the new asset if it was already in the array
      const newHistory = searchHistory.filter((oldAsset) => oldAsset.address !== asset.address)
      newHistory.unshift({ isNft, address: asset.address, chain })

      updateSearchHistory(newHistory)
    },
    [searchHistory, updateSearchHistory]
  )
}

export function useAddRecentlySearchedNFT() {
  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  return useCallback(
    (collection: GenieCollection) => addRecentlySearchedAsset(collection, true, Chain.Ethereum),
    [addRecentlySearchedAsset]
  )
}

export function useAddRecentlySearchedToken() {
  const addRecentlySearchedAsset = useAddRecentlySearchedAsset()
  return useCallback(
    (token: FungibleToken) => addRecentlySearchedAsset(token, false, chainIdToBackendName(token.chainId)),
    [addRecentlySearchedAsset]
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
          address: token.address === 'NATIVE' ? (null as unknown as string) : token.address,
          chain: token.chain,
        })),
    },
  })

  const data = useMemo(() => {
    if (shortenedHistory.length === 0) return []
    else if (!queryData) return undefined
    // Collects both tokens and collections in a map, so they can later be returned in original order
    const resultsMap: { [key: string]: GenieCollection | FungibleToken } = {}

    const tokens = queryData?.tokens && parseFungibleTokens(queryData.tokens)
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
      [queryCollections]
    )
    collections?.forEach((collection) => (resultsMap[collection.address] = collection))
    tokens?.forEach((token) => {
      if (token.address) resultsMap[token.address] = token
    })

    const data: (FungibleToken | GenieCollection)[] = []
    shortenedHistory.forEach((asset) => {
      if (resultsMap[asset.address]) data.push(resultsMap[asset.address])
    })
    return data
  }, [queryData, shortenedHistory])

  return { data, loading }
}
