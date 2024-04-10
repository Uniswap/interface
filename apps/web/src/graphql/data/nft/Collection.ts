import gql from 'graphql-tag'
import { GenieCollection, Trait } from 'nft/types'
import { useMemo } from 'react'

import { NftCollection, useCollectionQuery } from '../__generated__/types-and-hooks'

gql`
  query Collection($addresses: [String!]!) {
    nftCollections(filter: { addresses: $addresses }) {
      edges {
        cursor
        node {
          bannerImage {
            url
          }
          collectionId
          description
          discordUrl
          homepageUrl
          image {
            url
          }
          instagramName
          isVerified
          name
          numAssets
          twitterName
          nftContracts {
            address
            chain
            name
            standard
            symbol
            totalSupply
          }
          traits {
            name
            values
            stats {
              name
              value
              assets
              listings
            }
          }
          markets(currencies: ETH) {
            floorPrice {
              currency
              value
            }
            owners
            totalVolume {
              value
              currency
            }
            listings {
              value
            }
            volume(duration: DAY) {
              value
              currency
            }
            volumePercentChange(duration: DAY) {
              value
              currency
            }
            floorPricePercentChange(duration: DAY) {
              value
              currency
            }
            marketplaces {
              marketplace
              listings
              floorPrice
            }
          }
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

export function formatCollectionQueryData(
  queryCollection: NonNullable<NftCollection>,
  address?: string
): GenieCollection {
  const market = queryCollection?.markets?.[0]
  if (!address && !queryCollection?.nftContracts?.[0]?.address) return {} as GenieCollection
  const traits = {} as Record<string, Trait[]>
  if (queryCollection?.traits) {
    queryCollection?.traits.forEach((trait) => {
      if (trait.name && trait.stats) {
        traits[trait.name] = trait.stats.map((stats) => {
          return {
            trait_type: stats.name,
            trait_value: stats.value,
            trait_count: stats.assets,
          } as Trait
        })
      }
    })
  }
  return {
    address: address ?? queryCollection?.nftContracts?.[0]?.address ?? '',
    isVerified: queryCollection?.isVerified,
    name: queryCollection?.name,
    description: queryCollection?.description,
    standard: queryCollection?.nftContracts?.[0]?.standard,
    bannerImageUrl: queryCollection?.bannerImage?.url,
    stats: {
      num_owners: market?.owners,
      floor_price: market?.floorPrice?.value,
      one_day_volume: market?.volume?.value,
      one_day_change: market?.volumePercentChange?.value,
      one_day_floor_change: market?.floorPricePercentChange?.value,
      banner_image_url: queryCollection?.bannerImage?.url,
      total_supply: queryCollection?.numAssets,
      total_listings: market?.listings?.value,
      total_volume: market?.totalVolume?.value,
    },
    traits,
    marketplaceCount: market?.marketplaces?.map((market) => {
      return {
        marketplace: market.marketplace?.toLowerCase() ?? '',
        count: market.listings ?? 0,
        floorPrice: market.floorPrice ?? 0,
      }
    }),
    imageUrl: queryCollection?.image?.url ?? '',
    twitterUrl: queryCollection?.twitterName,
    instagram: queryCollection?.instagramName,
    discordUrl: queryCollection?.discordUrl,
    externalUrl: queryCollection?.homepageUrl,
    rarityVerified: false, // TODO update when backend supports
    // isFoundation: boolean, // TODO ask backend to add
  }
}

interface useCollectionReturnProps {
  data: GenieCollection
  loading: boolean
}

export function useCollection(address: string, skip?: boolean): useCollectionReturnProps {
  const { data: queryData, loading } = useCollectionQuery({
    variables: {
      addresses: address,
    },
    skip,
  })

  const queryCollection = queryData?.nftCollections?.edges?.[0]?.node as NonNullable<NftCollection>
  return useMemo(() => {
    return {
      data: formatCollectionQueryData(queryCollection, address),
      loading,
    }
  }, [address, loading, queryCollection])
}
