import { gql, useQuery } from '@apollo/client'
import { parseEther } from 'ethers/lib/utils'
import { GenieAsset, Rarity, SellOrder } from 'nft/types'

import { NftAssetsFilterInput, NftAssetSortableField } from '../__generated__/types-and-hooks'

const assetQuery = gql`
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
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

export function useAssetsQuery(
  address: string,
  orderBy: NftAssetSortableField,
  asc: boolean,
  filter: NftAssetsFilterInput,
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const { loading, data, fetchMore } = useQuery(assetQuery, {
    variables: {
      address,
      orderBy,
      asc,
      filter,
      first,
      after,
      last,
      before,
    },
    pollInterval: 999,
  })

  const loadMore = () =>
    fetchMore({
      variables: {
        after: data?.nftAssets?.pageInfo?.endCursor,
      },
    })

  const hasNext = data?.nftAssets?.pageInfo?.hasNextPage

  const assets: GenieAsset[] = data?.nftAssets?.edges?.map((queryAsset: { node: any }) => {
    const asset = queryAsset.node
    const ethPrice = parseEther(
      asset.listings?.edges[0]?.node.price.value?.toLocaleString('fullwide', { useGrouping: false }) ?? '0'
    ).toString()
    return {
      id: asset.id,
      address: asset.collection.nftContracts[0]?.address,
      notForSale: asset.listings?.edges.length === 0,
      collectionName: asset.collection?.name,
      collectionSymbol: asset.collection?.image?.url,
      imageUrl: asset.image?.url,
      animationUrl: asset.animationUrl,
      marketplace: asset.listings?.edges[0]?.node.marketplace.toLowerCase(),
      name: asset.name,
      priceInfo: asset.listings
        ? {
            ETHPrice: ethPrice,
            baseAsset: 'ETH',
            baseDecimals: '18',
            basePrice: ethPrice,
          }
        : undefined,
      susFlag: asset.suspiciousFlag,
      sellorders: asset.listings?.edges.map((listingNode: { node: SellOrder }) => {
        return {
          ...listingNode.node,
          protocolParameters: listingNode.node.protocolParameters
            ? JSON.parse(listingNode.node.protocolParameters.toString())
            : undefined,
        }
      }),
      smallImageUrl: asset.smallImage?.url,
      tokenId: asset.tokenId,
      tokenType: asset.collection.nftContracts[0]?.standard,
      // totalCount?: number, // TODO waiting for BE changes
      collectionIsVerified: asset.collection?.isVerified,
      rarity: {
        primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
        providers: asset.rarities.map((rarity: Rarity) => {
          return {
            ...rarity,
            provider: 'Rarity Sniper',
          }
        }),
      },
      owner: asset.ownerAddress,
      creator: {
        profile_img_url: asset.collection?.creator?.profileImage?.url,
        address: asset.collection?.creator?.address,
      },
      metadataUrl: asset.metadataUrl,
    }
  })
  return { assets, loading, loadMore, hasNext }
}
