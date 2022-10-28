import { parseEther } from '@ethersproject/units'
import graphql from 'babel-plugin-relay/macro'
import { CollectionInfoForAsset, GenieAsset, Markets, SellOrder, TokenType } from 'nft/types'
import { loadQuery, usePreloadedQuery } from 'react-relay'

import RelayEnvironment from '../RelayEnvironment'
import { DetailsQuery } from './__generated__/DetailsQuery.graphql'

const detailsQuery = graphql`
  query DetailsQuery($address: String!, $tokenId: String!) {
    nftAssets(address: $address, filter: { listed: false, tokenIds: [$tokenId] }) {
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
            numAssets
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
            description
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
          traits {
            name
            value
          }
        }
      }
    }
  }
`

export function useDetailsQuery(address: string, tokenId: string): [GenieAsset, CollectionInfoForAsset] | undefined {
  const detailsQueryReference = loadQuery<DetailsQuery>(RelayEnvironment, detailsQuery, {
    address,
    tokenId,
  })
  const queryData = usePreloadedQuery<DetailsQuery>(detailsQuery, detailsQueryReference)

  const asset = queryData.nftAssets?.edges[0].node
  const collection = asset?.collection
  const ethPrice = parseEther(asset?.listings?.edges[0].node.price.value?.toString() ?? '0').toString()

  if (!asset) return undefined

  return [
    {
      id: asset?.id,
      address,
      notForSale: asset.listings === null,
      collectionName: asset.collection?.name ?? undefined,
      collectionSymbol: asset.collection?.image?.url ?? undefined,
      imageUrl: asset.image?.url ?? undefined,
      animationUrl: asset.animationUrl ?? undefined,
      marketplace: asset.listings?.edges[0].node.marketplace.toLowerCase() as Markets,
      name: asset.name ?? undefined,
      priceInfo: asset.listings
        ? {
            ETHPrice: ethPrice,
            baseAsset: 'ETH',
            baseDecimals: '18',
            basePrice: ethPrice,
          }
        : undefined,
      susFlag: asset.suspiciousFlag ?? undefined,
      sellorders: asset.listings?.edges as unknown as SellOrder[],
      smallImageUrl: asset.smallImage?.url ?? undefined,
      tokenId,
      tokenType: (asset.collection?.nftContracts && asset?.collection.nftContracts[0].standard) as TokenType,
      // totalCount?: number, // TODO waiting for BE changes
      collectionIsVerified: asset.collection?.isVerified ?? undefined,
      rarity: {
        primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
        providers: asset.rarities as any,
      },
      owner: asset.ownerAddress ?? undefined,
      creator: {
        profile_img_url: asset.collection?.creator?.profileImage?.url ?? undefined,
        address: asset.collection?.creator?.address ?? undefined,
      },
      metadataUrl: asset.metadataUrl ?? undefined,
    },
    {
      collectionDescription: collection?.description ?? undefined,
      collectionImageUrl: collection?.image?.url ?? undefined,
      collectionName: collection?.name ?? undefined,
      isVerified: collection?.isVerified ?? undefined,
      totalSupply: collection?.numAssets ?? undefined,
    },
  ]
}
