import { isAddress } from '@ethersproject/address'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import gql from 'graphql-tag'
import { GenieCollection } from 'nft/types'
import { blocklistedCollections } from 'nft/utils'
import { useMemo } from 'react'

import { NftCollection, useCollectionSearchQuery } from '../__generated__/types-and-hooks'
import { formatCollectionQueryData, useCollection } from './Collection'

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

interface useCollectionSearchReturnProps {
  data: GenieCollection[]
  loading: boolean
}

function useCollectionQuerySearch(query: string, skip?: boolean): useCollectionSearchReturnProps {
  const { data: queryData, loading } = useCollectionSearchQuery({
    variables: {
      query,
    },
    skip,
  })

  return useMemo(() => {
    return {
      data:
        queryData?.nftCollections?.edges
          ?.filter(
            (collectionEdge) =>
              collectionEdge.node.nftContracts?.[0]?.address &&
              !blocklistedCollections.includes(collectionEdge.node.nftContracts?.[0]?.address)
          )
          .slice(0, MAX_SEARCH_RESULTS)
          .map((collectionEdge) => {
            const queryCollection = collectionEdge.node as NonNullable<NftCollection>
            return formatCollectionQueryData(queryCollection)
          }) ?? [],
      loading,
    }
  }, [loading, queryData])
}

export function useCollectionSearch(queryOrAddress: string): useCollectionSearchReturnProps {
  const isNftGraphqlEnabled = useNftGraphqlEnabled()
  const isName = !isAddress(queryOrAddress.toLowerCase())
  const queryResult = useCollectionQuerySearch(queryOrAddress, isNftGraphqlEnabled ? !isName : true)
  const addressResult = useCollection(queryOrAddress, isNftGraphqlEnabled ? isName : true)
  return isName ? queryResult : { data: [addressResult.data], loading: addressResult.loading }
}
