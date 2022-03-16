import { useEffect } from 'react'
import { useInfiniteQuery, useQuery } from 'react-query'
import { config } from 'src/config'
import {
  OpenseaNFTAsset,
  OpenseaNFTAssetResponse,
  OpenseaNFTCollectionResponse,
} from 'src/features/nfts/types'
import { logger } from 'src/utils/logger'

const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v1'
const OPENSEA_API_OPTIONS = {
  headers: { Accept: 'application/json', 'X-API-KEY': config.openseaApiKey },
}
const FETCH_NFT_LIMIT = 50

export function useAllNFTs(address?: Address) {
  async function fetchPage({ pageParam = '' }) {
    const nftAssetsUrl = `${OPENSEA_BASE_URL}/assets?owner=${address}&order_direction=desc&limit=${FETCH_NFT_LIMIT}&cursor=${pageParam}`

    try {
      const response = await fetch(nftAssetsUrl, OPENSEA_API_OPTIONS)
      return await response.json()
    } catch (e) {
      logger.error('useNfts', 'useAllNFTs', `Error fetching ${nftAssetsUrl}: ${e}`)
      throw e
    }
  }

  const { data, hasNextPage, fetchNextPage, status, error } =
    useInfiniteQuery<OpenseaNFTAssetResponse>(`nfts-${address}`, fetchPage, {
      getNextPageParam: (lastPage: OpenseaNFTAssetResponse) => lastPage.next ?? false,
    })

  const numPages = data?.pages.length ?? 0

  // Continue fetching next page as long as there are more pages
  useEffect(() => {
    if (numPages > 0 && hasNextPage) {
      fetchNextPage()
    }
  }, [numPages, fetchNextPage, hasNextPage])

  // TODO: consider incremental page processing
  const allNFTAssets = data?.pages.map((page) => page.assets).flat()

  const nftsByCollection = Object.values(
    allNFTAssets?.reduce<Record<string, OpenseaNFTAsset[]>>((all, nft) => {
      if (nft) {
        const key = nft.collection.slug
        all[key] ??= []
        all[key]!.push(nft)
      }
      return all
    }, {}) ?? {}
  )

  return { nftsByCollection, loading: hasNextPage, error, status }
}

export function useNFTCollection(slug: string) {
  async function fetchPage() {
    const collectionUrl = `${OPENSEA_BASE_URL}/collection/${slug}`

    try {
      const response = await fetch(collectionUrl, OPENSEA_API_OPTIONS)
      return await response.json()
    } catch (e) {
      logger.error('useNfts', 'useNFTCollection', `Error fetching ${collectionUrl}: ${e}`)
      throw e
    }
  }

  const { data, error, status } = useQuery<OpenseaNFTCollectionResponse>(
    `nft-collection-${slug}`,
    fetchPage
  )

  return { collection: data?.collection, error, status }
}
