import { Chain, NftCollection, useRecentlySearchedAssetsQuery } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { useAtom } from 'jotai'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { GenieCollection } from 'nft/types'
import { useCallback, useMemo } from 'react'

type RecentlySearchedAsset = {
  isNft?: boolean
  address: string
  chain: Chain
}

const recentlySearchedAssetsAtom = atomWithStorage<RecentlySearchedAsset[]>('recentlySearchedAssets', [])

export function useAddRecentlySearchedAsset() {
  const [searchHistory, updateSearchHistory] = useAtom(recentlySearchedAssetsAtom)

  return useCallback(
    (asset: RecentlySearchedAsset) => {
      // Removes the new asset if it was already in the array
      const newHistory = searchHistory.filter(
        (oldAsset) => oldAsset.address !== asset.address || oldAsset.address !== asset.chain
      )
      newHistory.unshift(asset)
      updateSearchHistory(newHistory)
    },
    [searchHistory, updateSearchHistory]
  )
}

export function useRecentlySearchedAssets() {
  const history = useAtomValue(recentlySearchedAssetsAtom)
  const shortenedHistory = useMemo(() => history.slice(0, 4), [history])
  const test = shortenedHistory.map((token) => ({
    address: token.address === 'NATIVE' ? (null as unknown as string) : token.address,
    chain: token.chain,
  }))

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
      [queryCollections]
    )
    collections?.forEach((collection) => (resultsMap[collection.address] = collection))
    queryData.tokens?.forEach((token) => {
      resultsMap[token.address ?? `NATIVE-${token.chain}`] = token
    })

    const data: (SearchToken | GenieCollection)[] = []
    shortenedHistory.forEach((asset) => {
      const address = asset.address === 'NATIVE' ? `NATIVE-${asset.chain}` : asset.address
      if (resultsMap[address]) data.push(resultsMap[address])
    })
    return data
  }, [queryData, shortenedHistory])

  return { data, loading }
}
