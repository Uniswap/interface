import { isAddress } from '@ethersproject/address'
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
          image {
            url
          }
          isVerified
          name
          numAssets
          nftContracts {
            address
            chain
            name
            symbol
            totalSupply
          }
          markets(currencies: ETH) {
            floorPrice {
              currency
              value
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
    skip: skip || !query,
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
  const isName = !isAddress(queryOrAddress.toLowerCase())
  const queryResult = useCollectionQuerySearch(queryOrAddress, /* skip= */ !isName)
  const addressResult = useCollection(queryOrAddress, /* skip= */ isName)
  return isName
    ? queryResult
    : blocklistedCollections.includes(queryOrAddress)
    ? { data: [], loading: false }
    : { data: [addressResult.data], loading: addressResult.loading }
}
