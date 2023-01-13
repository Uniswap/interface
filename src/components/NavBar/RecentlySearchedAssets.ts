import { Chain, useRecentlySearchedTokensQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useRecentlySearchedCollections } from 'graphql/data/nft/Collection'
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

  const { data: recentlySearchedCollections, loading: collectionsLoading } = useRecentlySearchedCollections(
    shortenedHistory.filter((asset) => asset.isNft).map((asset) => asset.address)
  )

  const { data: recentlySearchedTokens, loading: tokensLoading } = useRecentlySearchedTokensQuery({
    variables: {
      contracts: shortenedHistory
        .filter((asset) => !asset.isNft)
        .map((token) => ({ address: token.address, chain: token.chain })),
    },
  })

  const data = useMemo(() => {
    if (!collectionsLoading && !tokensLoading) {
      const parsedFungibleTokens = recentlySearchedTokens?.tokens && parseFungibleTokens(recentlySearchedTokens?.tokens)
      const resultsMap: { [key: string]: GenieCollection | FungibleToken } = {}
      recentlySearchedCollections?.forEach((collection) => (resultsMap[collection.address] = collection))
      parsedFungibleTokens?.filter(Boolean).forEach((token) => {
        if (token.address) resultsMap[token.address] = token
      })

      console.log(recentlySearchedTokens)

      const results: (FungibleToken | GenieCollection)[] = []
      shortenedHistory.forEach((asset) => {
        if (resultsMap[asset.address]) results.push(resultsMap[asset.address])
      })
      return results
    }
    return []
  }, [collectionsLoading, tokensLoading, recentlySearchedTokens, recentlySearchedCollections, shortenedHistory])

  return {
    data: shortenedHistory.length > 0 ? data : [],
    loading: (collectionsLoading || tokensLoading) && shortenedHistory.length > 0,
  }
}
