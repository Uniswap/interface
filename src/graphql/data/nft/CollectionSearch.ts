import gql from 'graphql-tag'
import { useMemo } from 'react'

import { NftCollection, useCollectionSearchQuery } from '../__generated__/types-and-hooks'
import { formatCollectionQueryData, useCollectionReturnProps } from './Collection'

const MAX_SEARCH_RESULTS = 6

gql`
  query CollectionSearch($query: String!) {
    nftCollections(filter: { nameQuery: $query }) {
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

function useCollectionSearch(query: string): useCollectionReturnProps {
  const { data: queryData, loading } = useCollectionSearchQuery({
    variables: {
      query,
    },
  })

  const queryCollection = queryData?.nftCollections?.edges?.[0]?.node as NonNullable<NftCollection>
  return useMemo(() => {
    return {
      data: formatCollectionQueryData(queryCollection),
      loading,
    }
  }, [loading, queryCollection])
}
