import { parseEther } from '@ethersproject/units'
import graphql from 'babel-plugin-relay/macro'
import { CollectionInfoForAsset, GenieAsset, Rarity, SellOrder, TokenType } from 'nft/types'
import { useLazyLoadQuery } from 'react-relay'

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
          creator {
            address
            profileImage {
              url
            }
            isVerified
          }
          collection {
            name
            isVerified
            numAssets
            image {
              url
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
  const queryData = useLazyLoadQuery<DetailsQuery>(detailsQuery, {
    address,
    tokenId,
  })

  const asset = queryData.nftAssets?.edges[0]?.node as any
  const collection = asset?.collection
  const ethPrice = parseEther(asset?.listings?.edges[0]?.node.price.value?.toString()).toString()

  return [
    {
      id: asset?.id,
      address,
      notForSale: asset.listings === null,
      collectionName: asset.collection?.name,
      collectionSymbol: asset.collection?.image?.url,
      imageUrl: asset.image?.url,
      animationUrl: asset.animationUrl,
      marketplace: asset.listings?.edges[0]?.node.marketplace.toLowerCase(),
      name: asset.name,
      priceInfo: {
        ETHPrice: ethPrice,
        baseAsset: 'ETH',
        baseDecimals: '18',
        basePrice: ethPrice,
      },
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
      tokenId,
      tokenType: (asset.collection?.nftContracts && asset?.collection.nftContracts[0]?.standard) as TokenType,
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
        profile_img_url: asset.creator?.profileImage?.url,
        address: asset.creator?.address,
      },
      metadataUrl: asset.metadataUrl,
      traits: asset.traits?.map((trait: { name: string; value: string }) => {
        return { trait_type: trait.name, value: trait.value } as any
      }),
    },
    {
      collectionDescription: collection?.description,
      collectionImageUrl: collection?.image?.url,
      collectionName: collection?.name,
      isVerified: collection?.isVerified,
      totalSupply: collection?.numAssets,
    },
  ]
}
