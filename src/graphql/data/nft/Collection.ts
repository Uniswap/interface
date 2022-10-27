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

  const queryCollection = queryData.nftCollections?.edges[0].node
  const traits = {} as Record<string, Trait[]>
  if (queryCollection?.traits) {
    for (const trait of queryCollection?.traits) {
      traits[trait.name ?? ''] =
        trait.values?.map((value) => {
          return {
            trait_type: trait.name,
            trait_value: value,
          } as Trait
        }) ?? ({} as Trait[])
    }
  }
  return {
    address,
    isVerified: queryCollection?.isVerified ?? undefined,
    name: queryCollection?.name ?? undefined,
    description: queryCollection?.description ?? undefined,
    standard: queryCollection?.nftContracts ? queryCollection?.nftContracts[0].standard ?? undefined : undefined,
    bannerImageUrl: queryCollection?.bannerImage?.url ?? undefined,
    floorPrice: queryCollection?.markets ? queryCollection?.markets[0].floorPrice?.value ?? undefined : undefined,
    stats: queryCollection?.markets
      ? {
          num_owners: queryCollection?.markets[0].owners ?? undefined,
          floor_price: queryCollection?.markets[0].floorPrice?.value ?? undefined,
          one_day_volume: queryCollection?.markets[0].volume?.value ?? undefined,
          one_day_change: queryCollection?.markets[0].volumePercentChange?.value ?? undefined,
          one_day_floor_change: queryCollection?.markets[0].floorPricePercentChange?.value ?? undefined,
          banner_image_url: queryCollection?.bannerImage?.url ?? undefined,
          total_supply: queryCollection?.numAssets ?? undefined,
          total_listings: queryCollection?.markets[0].listings ?? undefined,
          total_volume: queryCollection?.markets[0].totalVolume?.value ?? undefined,
        }
      : undefined,
    traits,
    // marketplaceCount: { marketplace: string; count: number }[], // TODO add when backend supports
    imageUrl: queryCollection?.image?.url ?? undefined,
    twitter: queryCollection?.twitterName ?? undefined,
    instagram: queryCollection?.instagramName ?? undefined,
    discordUrl: queryCollection?.discordUrl ?? undefined,
    externalUrl: queryCollection?.homepageUrl ?? undefined,
    // rarityVerified: boolean, // TODO move check to individual assets
    // isFoundation: boolean, // TODO ask backend to add
  }
}
