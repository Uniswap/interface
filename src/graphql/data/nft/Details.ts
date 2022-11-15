import { parseEther } from '@ethersproject/units'
import graphql from 'babel-plugin-relay/macro'
import { CollectionInfoForAsset, GenieAsset, SellOrder, TokenType } from 'nft/types'
import { useEffect } from 'react'
import { useLazyLoadQuery, useQueryLoader } from 'react-relay'

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

export function useLoadDetailsQuery(address?: string, tokenId?: string): void {
  const [, loadQuery] = useQueryLoader(detailsQuery)
  useEffect(() => {
    if (address && tokenId) {
      loadQuery({ address, tokenId })
    }
  }, [address, tokenId, loadQuery])
}

export function useDetailsQuery(address: string, tokenId: string): [GenieAsset, CollectionInfoForAsset] | undefined {
  const queryData = useLazyLoadQuery<DetailsQuery>(
    detailsQuery,
    {
      address,
      tokenId,
    },
    { fetchPolicy: 'store-or-network' }
  )

  const asset = queryData.nftAssets?.edges[0]?.node
  const collection = asset?.collection
  const listing = asset?.listings?.edges[0]?.node
  const ethPrice = parseEther(listing?.price?.value?.toString() ?? '0').toString()

  return [
    {
      id: asset?.id,
      address,
      notForSale: asset?.listings === null,
      collectionName: asset?.collection?.name ?? undefined,
      collectionSymbol: asset?.collection?.image?.url ?? undefined,
      imageUrl: asset?.image?.url ?? undefined,
      animationUrl: asset?.animationUrl ?? undefined,
      // todo: fix the back/frontend discrepency here and drop the any
      marketplace: listing?.marketplace.toLowerCase() as any,
      name: asset?.name ?? undefined,
      priceInfo: {
        ETHPrice: ethPrice,
        baseAsset: 'ETH',
        baseDecimals: '18',
        basePrice: ethPrice,
      },
      susFlag: asset?.suspiciousFlag ?? undefined,
      sellorders: asset?.listings?.edges.map((listingNode) => {
        return {
          ...listingNode.node,
          protocolParameters: listingNode.node.protocolParameters
            ? JSON.parse(listingNode.node.protocolParameters.toString())
            : undefined,
        } as SellOrder
      }),
      smallImageUrl: asset?.smallImage?.url ?? undefined,
      tokenId,
      tokenType: (asset?.collection?.nftContracts && asset?.collection.nftContracts[0]?.standard) as TokenType,
      collectionIsVerified: asset?.collection?.isVerified ?? undefined,
      rarity: {
        primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
        providers: asset?.rarities
          ? asset?.rarities?.map((rarity) => {
              return {
                rank: rarity.rank ?? undefined,
                score: rarity.score ?? undefined,
                provider: 'Rarity Sniper',
              }
            })
          : undefined,
      },
      owner: { address: asset?.ownerAddress ?? '' },
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
      collectionDescription: collection?.description ?? undefined,
      collectionImageUrl: collection?.image?.url ?? undefined,
      collectionName: collection?.name ?? undefined,
      isVerified: collection?.isVerified ?? undefined,
      totalSupply: collection?.numAssets ?? undefined,
      twitterUrl: collection?.twitterName ?? undefined,
      discordUrl: collection?.discordUrl ?? undefined,
      externalUrl: collection?.homepageUrl ?? undefined,
    },
  ]
}
