import graphql from 'babel-plugin-relay/macro'
import { GenieCollection, Trait } from 'nft/types'
import { useLazyLoadQuery } from 'react-relay'

import { CollectionQuery } from './__generated__/CollectionQuery.graphql'

const collectionQuery = graphql`
  query CollectionQuery($address: String!) {
    nftCollections(filter: { addresses: [$address] }) {
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

export function useCollectionQuery(address: string): GenieCollection | undefined {
  const queryData = useLazyLoadQuery<CollectionQuery>(collectionQuery, { address })

  const queryCollection = queryData.nftCollections?.edges[0]?.node
  const market = queryCollection?.markets && queryCollection?.markets[0]
  const traits = {} as Record<string, Trait[]>
  if (queryCollection?.traits) {
    queryCollection?.traits.forEach((trait) => {
      if (trait.name && trait.values) {
        traits[trait.name] = trait.values.map((value) => {
          return {
            trait_type: trait.name,
            trait_value: value,
          } as Trait
        })
      }
    })
  }
  return {
    address,
    isVerified: queryCollection?.isVerified ?? undefined,
    name: queryCollection?.name ?? undefined,
    description: queryCollection?.description ?? undefined,
    standard: queryCollection?.nftContracts ? queryCollection?.nftContracts[0]?.standard ?? undefined : undefined,
    bannerImageUrl: queryCollection?.bannerImage?.url,
    stats: queryCollection?.markets
      ? {
          num_owners: market?.owners ?? undefined,
          floor_price: market?.floorPrice?.value ?? undefined,
          one_day_volume: market?.volume?.value ?? undefined,
          one_day_change: market?.volumePercentChange?.value ?? undefined,
          one_day_floor_change: market?.floorPricePercentChange?.value ?? undefined,
          banner_image_url: queryCollection?.bannerImage?.url ?? undefined,
          total_supply: queryCollection?.numAssets ?? undefined,
          total_listings: market?.listings?.value ?? undefined,
          total_volume: market?.totalVolume?.value ?? undefined,
        }
      : {},
    traits,
    // marketplaceCount: { marketplace: string; count: number }[], // TODO add when backend supports
    imageUrl: queryCollection?.image?.url ?? '',
    twitterUrl: queryCollection?.twitterName ?? '',
    instagram: queryCollection?.instagramName ?? undefined,
    discordUrl: queryCollection?.discordUrl ?? undefined,
    externalUrl: queryCollection?.homepageUrl ?? undefined,
    rarityVerified: false, // TODO update when backend supports
    // isFoundation: boolean, // TODO ask backend to add
  }
}
