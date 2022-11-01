import graphql from 'babel-plugin-relay/macro'
import { Trait } from 'nft/hooks/useCollectionFilters'
import { GenieCollection } from 'nft/types'
import { loadQuery, usePreloadedQuery } from 'react-relay'

import RelayEnvironment from '../RelayEnvironment'
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
            listings
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
  const collectionQueryReference = loadQuery<CollectionQuery>(RelayEnvironment, collectionQuery, {
    address,
  })
  const queryData = usePreloadedQuery<CollectionQuery>(collectionQuery, collectionQueryReference)

  const queryCollection = queryData.nftCollections?.edges[0].node as any
  const traits = {} as Record<string, Trait[]>
  if (queryCollection?.traits) {
    queryCollection?.traits.forEach((trait: { name: string; values: string[] }) => {
      traits[trait.name] = trait.values?.map((value) => {
        return {
          trait_type: trait.name,
          trait_value: value,
        } as Trait
      })
    })
  }
  return {
    address,
    isVerified: queryCollection?.isVerified,
    name: queryCollection?.name,
    description: queryCollection?.description,
    standard: queryCollection?.nftContracts[0]?.standard,
    bannerImageUrl: queryCollection?.bannerImage?.url,
    stats: {
      num_owners: queryCollection?.markets[0]?.owners,
      floor_price: queryCollection?.markets[0]?.floorPrice?.value,
      one_day_volume: queryCollection?.markets[0]?.volume?.value,
      one_day_change: queryCollection?.markets[0]?.volumePercentChange?.value,
      one_day_floor_change: queryCollection?.markets[0]?.floorPricePercentChange?.value,
      banner_image_url: queryCollection?.bannerImage?.url,
      total_supply: queryCollection?.numAssets,
      total_listings: queryCollection?.markets[0]?.listings,
      total_volume: queryCollection?.markets[0]?.totalVolume?.value,
    },
    traits,
    // marketplaceCount: { marketplace: string; count: number }[], // TODO add when backend supports
    imageUrl: queryCollection?.image?.url,
    twitter: queryCollection?.twitterName,
    instagram: queryCollection?.instagramName,
    discordUrl: queryCollection?.discordUrl,
    externalUrl: queryCollection?.homepageUrl,
    rarityVerified: false, // TODO update when backend supports
    // isFoundation: boolean, // TODO ask backend to add
  }
}
