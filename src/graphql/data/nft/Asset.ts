import { parseEther } from 'ethers/lib/utils'
import gql from 'graphql-tag'
import { GenieAsset, Markets, Trait } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useCallback, useMemo } from 'react'

import {
  AssetQueryVariables,
  NftAssetEdge,
  NftAssetsFilterInput,
  NftAssetSortableField,
  NftAssetTraitInput,
  NftMarketplace,
  useAssetQuery,
} from '../__generated__/types-and-hooks'

gql`
  query Asset(
    $address: String!
    $orderBy: NftAssetSortableField
    $asc: Boolean
    $filter: NftAssetsFilterInput
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    nftAssets(
      address: $address
      orderBy: $orderBy
      asc: $asc
      filter: $filter
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        node {
          id
          name
          ownerAddress
          image {
            url
          }
          smallImage {
            url
          }
          originalImage {
            url
          }
          tokenId
          description
          animationUrl
          suspiciousFlag
          collection {
            name
            isVerified
            image {
              url
            }
            creator {
              address
              profileImage {
                url
              }
              isVerified
            }
            nftContracts {
              address
              standard
            }
          }
          listings(first: 1) {
            edges {
              node {
                address
                createdAt
                endAt
                id
                maker
                marketplace
                marketplaceUrl
                orderHash
                price {
                  currency
                  value
                }
                quantity
                startAt
                status
                taker
                tokenId
                type
                protocolParameters
              }
              cursor
            }
          }
          rarities {
            provider
            rank
            score
          }
          metadataUrl
        }
        cursor
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

function formatAssetQueryData(queryAsset: NftAssetEdge, totalCount?: number) {
  const asset = queryAsset.node
  const ethPrice = parseEther(wrapScientificNotation(asset.listings?.edges[0]?.node.price.value ?? 0)).toString()
  return {
    id: asset.id,
    address: asset?.collection?.nftContracts?.[0]?.address ?? '',
    notForSale: asset.listings?.edges?.length === 0,
    collectionName: asset.collection?.name,
    collectionSymbol: asset.collection?.image?.url,
    imageUrl: asset.image?.url,
    animationUrl: asset.animationUrl,
    marketplace: asset.listings?.edges[0]?.node?.marketplace?.toLowerCase() as unknown as Markets,
    name: asset.name,
    priceInfo: {
      ETHPrice: ethPrice,
      baseAsset: 'ETH',
      baseDecimals: '18',
      basePrice: ethPrice,
    },
    susFlag: asset.suspiciousFlag,
    sellorders: asset.listings?.edges.map((listingNode) => {
      return {
        ...listingNode.node,
        protocolParameters: listingNode.node?.protocolParameters
          ? JSON.parse(listingNode.node?.protocolParameters.toString())
          : undefined,
      }
    }),
    smallImageUrl: asset.smallImage?.url,
    tokenId: asset.tokenId ?? '',
    tokenType: asset.collection?.nftContracts?.[0]?.standard,
    totalCount,
    collectionIsVerified: asset.collection?.isVerified,
    rarity: {
      primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
      providers: asset.rarities?.map((rarity) => {
        return {
          ...rarity,
          provider: 'Rarity Sniper',
        }
      }),
    },
    ownerAddress: asset.ownerAddress,
    creator: {
      profile_img_url: asset.collection?.creator?.profileImage?.url,
      address: asset.collection?.creator?.address,
    },
    metadataUrl: asset.metadataUrl,
  }
}

export const ASSET_PAGE_SIZE = 25

export interface AssetFetcherParams {
  address: string
  orderBy: NftAssetSortableField
  asc: boolean
  filter: NftAssetsFilterInput
  first?: number
  after?: string
  last?: number
  before?: string
}

const defaultAssetFetcherParams: Omit<AssetQueryVariables, 'address'> = {
  orderBy: NftAssetSortableField.Price,
  asc: true,
  // tokenSearchQuery must be specified so that this exactly matches the initial query.
  filter: { listed: false, tokenSearchQuery: '' },
  first: ASSET_PAGE_SIZE,
}

export function useNftAssets(params: AssetFetcherParams) {
  const variables = useMemo(() => ({ ...defaultAssetFetcherParams, ...params }), [params])

  const { data, loading, fetchMore } = useAssetQuery({
    variables,
  })
  const hasNext = data?.nftAssets?.pageInfo?.hasNextPage
  const loadMore = useCallback(
    () =>
      fetchMore({
        variables: {
          after: data?.nftAssets?.pageInfo?.endCursor,
        },
      }),
    [data, fetchMore]
  )

  // TODO: setup polling while handling pagination

  // It is especially important for this to be memoized to avoid re-rendering from polling if data is unchanged.
  const assets: GenieAsset[] | undefined = useMemo(
    () =>
      data?.nftAssets?.edges?.map((queryAsset) => {
        return formatAssetQueryData(queryAsset as NonNullable<NftAssetEdge>, data.nftAssets?.totalCount)
      }),
    [data?.nftAssets?.edges, data?.nftAssets?.totalCount]
  )

  return useMemo(() => {
    return {
      data: assets,
      hasNext,
      loading,
      loadMore,
    }
  }, [assets, hasNext, loadMore, loading])
}

const DEFAULT_SWEEP_AMOUNT = 50

export interface SweepFetcherParams {
  contractAddress: string
  markets?: string[]
  price?: { high?: number | string; low?: number | string; symbol: string }
  traits?: Trait[]
}

function useSweepFetcherVars({ contractAddress, markets, price, traits }: SweepFetcherParams): AssetQueryVariables {
  const filter: NftAssetsFilterInput = useMemo(
    () => ({
      listed: true,
      maxPrice: price?.high?.toString(),
      minPrice: price?.low?.toString(),
      traits:
        traits && traits.length > 0
          ? traits?.map((trait) => {
              return { name: trait.trait_type, values: [trait.trait_value] } as unknown as NftAssetTraitInput
            })
          : undefined,
      marketplaces:
        markets && markets.length > 0 ? markets?.map((market) => market.toUpperCase() as NftMarketplace) : undefined,
    }),
    [markets, price?.high, price?.low, traits]
  )
  return useMemo(
    () => ({
      address: contractAddress,
      orderBy: NftAssetSortableField.Price,
      asc: true,
      first: DEFAULT_SWEEP_AMOUNT,
      filter,
    }),
    [contractAddress, filter]
  )
}

export function useSweepNftAssets(params: SweepFetcherParams) {
  const variables = useSweepFetcherVars(params)
  const { data, loading } = useAssetQuery({
    variables,
    // This prevents overwriting the page's call to assets for cards shown
    fetchPolicy: 'no-cache',
  })
  const assets = useMemo<GenieAsset[] | undefined>(
    () =>
      data?.nftAssets?.edges?.map((queryAsset) => {
        return formatAssetQueryData(queryAsset as NonNullable<NftAssetEdge>, data.nftAssets?.totalCount)
      }),
    [data?.nftAssets?.edges, data?.nftAssets?.totalCount]
  )
  return useMemo(() => ({ data: assets, loading }), [assets, loading])
}
