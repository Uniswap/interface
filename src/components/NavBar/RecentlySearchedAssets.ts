import { Chain, useRecentlySearchedTokensQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useRecentlySearchedCollections } from 'graphql/data/nft/Collection'
import { atomWithStorage, useAtomValue } from 'jotai/utils'
import { FungibleToken, GenieCollection, parseFungibleTokens } from 'nft/types'
import { useMemo } from 'react'

type RecentlySearchedAsset = {
  isNft: boolean
  address: string
  chain: Chain
}

export const recentlySearchedAssetsAtom = atomWithStorage<RecentlySearchedAsset[]>('recentlySearchedAssets', [])

export function useRecentlySearchedAssets() {
  const history = useAtomValue(recentlySearchedAssetsAtom).slice(0, 4)

  const { data: recentlySearchedCollections, loading: collectionsLoading } = useRecentlySearchedCollections(
    history.filter((asset) => asset.isNft).map((asset) => asset.address)
  )

  const { data: recentlySearchedTokens, loading: tokensLoading } = useRecentlySearchedTokensQuery({
    variables: { contracts: history.filter((asset) => !asset.isNft).map((asset) => ({ ...asset })) },
  })

  const data = useMemo(() => {
    if (!collectionsLoading && !tokensLoading) {
      const parsedFungibleTokens = recentlySearchedTokens?.tokens && parseFungibleTokens(recentlySearchedTokens?.tokens)
      const resultsMap: { [key: string]: GenieCollection | FungibleToken } = {}
      recentlySearchedCollections?.forEach((collection) => resultsMap[collection.address])
      parsedFungibleTokens?.filter(Boolean).forEach((token) => {
        if (token.address) resultsMap[token.address] = token
      })

      const results: (FungibleToken | GenieCollection)[] = []
      history.forEach((asset) => {
        if (resultsMap[asset.address]) results.push(resultsMap[asset.address])
      })
      return results
    }
    return []
  }, [collectionsLoading, tokensLoading, recentlySearchedCollections, recentlySearchedTokens?.tokens, history])

  return { data, loading: collectionsLoading || tokensLoading }
}
