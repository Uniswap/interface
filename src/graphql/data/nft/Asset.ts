/* eslint-disable import/no-unused-modules */
import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import { GenieAsset, Markets, Trait } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useMemo } from 'react'

import {
  AssetQueryQueryVariables,
  NftAssetEdge,
  NftAssetsFilterInput,
  NftAssetSortableField,
  NftAssetTraitInput,
  NftMarketplace,
  useAssetQueryQuery,
} from '../__generated__/types-and-hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assetPaginationQuery = graphql`
  query AssetQuery(
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

// type NftAssetsQueryAsset = NonNullable<
//   NonNullable<NonNullable<AssetQuery_nftAssets$data['nftAssets']>['edges']>[number]
// >

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
    priceInfo: asset.listings
      ? {
          ETHPrice: ethPrice,
          baseAsset: 'ETH',
          baseDecimals: '18',
          basePrice: ethPrice,
        }
      : {
          ETHPrice: '0',
          baseAsset: 'ETH',
          baseDecimals: '18',
          basePrice: '0',
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
    owner: { address: asset.ownerAddress },
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

const defaultAssetFetcherParams: Omit<AssetQueryQueryVariables, 'address'> = {
  orderBy: NftAssetSortableField.Price,
  asc: true,
  // tokenSearchQuery must be specified so that this exactly matches the initial query.
  filter: { listed: false, tokenSearchQuery: '' },
  first: ASSET_PAGE_SIZE,
}

export function useLoadAssetsQuery(params: AssetFetcherParams) {
  const variables = useMemo(() => ({ ...defaultAssetFetcherParams, ...params }), [params])

  const { data, loading, fetchMore } = useAssetQueryQuery({
    variables,
  })
  const hasNext = data?.nftAssets?.pageInfo?.hasNextPage
  const loadMore = () =>
    fetchMore({
      variables: {
        after: data?.nftAssets?.pageInfo?.endCursor,
      },
    })

  // TODO: setup polling while handling pagination

  // It is especially important for this to be memoized to avoid re-rendering from polling if data is unchanged.
  const assets: GenieAsset[] | undefined = useMemo(
    () =>
      data?.nftAssets?.edges?.map((queryAsset) => {
        const castedAsset = queryAsset as unknown as NftAssetEdge
        return formatAssetQueryData(castedAsset, data.nftAssets?.totalCount)
      }),
    [data?.nftAssets?.edges, data?.nftAssets?.totalCount]
  )

  return { data: assets, hasNext, loading, loadMore }
}

const DEFAULT_SWEEP_AMOUNT = 50

export interface SweepFetcherParams {
  contractAddress: string
  markets?: string[]
  price?: { high?: number | string; low?: number | string; symbol: string }
  traits?: Trait[]
}

function useSweepFetcherVars({
  contractAddress,
  markets,
  price,
  traits,
}: SweepFetcherParams): AssetQueryQueryVariables {
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

// Lazy-loads an already loaded AssetsQuery.
// This will *not* trigger a query - that must be done from a parent component to ensure proper query coalescing and to
// prevent waterfalling. Use useLoadSweepAssetsQuery to trigger the query.
export function useLoadSweepAssetsQuery(params: SweepFetcherParams) {
  const variables = useSweepFetcherVars(params)
  const { data, loading } = useAssetQueryQuery({
    variables,
  })
  const assets = useMemo<GenieAsset[] | undefined>(
    () =>
      data?.nftAssets?.edges?.map((queryAsset) => {
        const castedAsset = queryAsset as unknown as NftAssetEdge
        return formatAssetQueryData(castedAsset, data.nftAssets?.totalCount)
      }),
    [data?.nftAssets?.edges, data?.nftAssets?.totalCount]
  )
  return { data: assets, loading }
}
