import { parseEther } from '@ethersproject/units'
import gql from 'graphql-tag'
import { CollectionInfoForAsset, GenieAsset, Markets, SellOrder } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useMemo } from 'react'

import { NftAsset, useDetailsQuery } from '../__generated__/types-and-hooks'

gql`
  query Details($address: String!, $tokenId: String!) {
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
            twitterName
            discordUrl
            homepageUrl
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

export function useNftAssetDetails(
  address: string,
  tokenId: string
): { data: [GenieAsset, CollectionInfoForAsset]; loading: boolean } {
  const { data: queryData, loading } = useDetailsQuery({
    variables: {
      address,
      tokenId,
    },
  })

  const asset = queryData?.nftAssets?.edges[0]?.node as NonNullable<NftAsset> | undefined
  const collection = asset?.collection
  const listing = asset?.listings?.edges[0]?.node
  const ethPrice = parseEther(wrapScientificNotation(listing?.price?.value?.toString() ?? '0')).toString()

  return useMemo(
    () => ({
      data: [
        {
          id: asset?.id,
          address,
          notForSale: asset?.listings === null,
          collectionName: asset?.collection?.name,
          collectionSymbol: asset?.collection?.image?.url,
          imageUrl: asset?.image?.url,
          animationUrl: asset?.animationUrl,
          marketplace: listing?.marketplace.toLowerCase() as unknown as Markets,
          name: asset?.name,
          priceInfo: {
            ETHPrice: ethPrice,
            baseAsset: 'ETH',
            baseDecimals: '18',
            basePrice: ethPrice,
          },
          susFlag: asset?.suspiciousFlag,
          sellorders: asset?.listings?.edges.map((listingNode) => {
            return {
              ...listingNode.node,
              protocolParameters: listingNode.node.protocolParameters
                ? JSON.parse(listingNode.node.protocolParameters.toString())
                : undefined,
            } as SellOrder
          }),
          smallImageUrl: asset?.smallImage?.url,
          tokenId,
          tokenType: asset?.collection?.nftContracts?.[0]?.standard,
          collectionIsVerified: asset?.collection?.isVerified,
          rarity: {
            primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
            providers: asset?.rarities?.map((rarity) => {
              return {
                rank: rarity.rank,
                score: rarity.score,
                provider: 'Rarity Sniper',
              }
            }),
          },
          ownerAddress: asset?.ownerAddress,
          creator: {
            profile_img_url: asset?.creator?.profileImage?.url ?? '',
            address: asset?.creator?.address ?? '',
          },
          metadataUrl: asset?.metadataUrl ?? '',
          traits: asset?.traits?.map((trait) => {
            return { trait_type: trait.name ?? '', trait_value: trait.value ?? '' }
          }),
        },
        {
          collectionDescription: collection?.description,
          collectionImageUrl: collection?.image?.url,
          collectionName: collection?.name,
          isVerified: collection?.isVerified,
          totalSupply: collection?.numAssets,
          twitterUrl: collection?.twitterName,
          discordUrl: collection?.discordUrl,
          externalUrl: collection?.homepageUrl,
        },
      ],
      loading,
    }),
    [address, asset, collection, ethPrice, listing?.marketplace, loading, tokenId]
  )
}
