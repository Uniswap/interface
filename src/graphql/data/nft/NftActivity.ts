import gql from 'graphql-tag'
import { ActivityEvent } from 'nft/types'
import { useCallback, useMemo } from 'react'

import { NftActivityFilterInput, useNftActivityQuery } from '../__generated__/types-and-hooks'

gql`
  query NftActivity($filter: NftActivityFilterInput, $cursor: String, $limit: Int) {
    nftActivity(filter: $filter, cursor: $cursor, limit: $limit) {
      edges {
        node {
          id
          address
          tokenId
          asset {
            id
            metadataUrl
            image {
              id
              url
            }
            smallImage {
              id
              url
            }
            name
            rarities {
              id
              provider
              rank
              score
            }
            suspiciousFlag
            nftContract {
              id
              standard
            }
            collection {
              id
              image {
                id
                url
              }
            }
          }
          type
          marketplace
          fromAddress
          toAddress
          transactionHash
          price {
            id
            value
          }
          orderStatus
          quantity
          url
          timestamp
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

function useNftActivity(filter: NftActivityFilterInput, cursor?: string, limit?: number) {
  const { data, loading, fetchMore } = useNftActivityQuery({
    variables: {
      filter,
      cursor,
      limit,
    },
  })

  const hasNext = data?.nftActivity?.pageInfo?.hasNextPage
  const loadMore = useCallback(
    () =>
      fetchMore({
        variables: {
          after: data?.nftActivity?.pageInfo?.endCursor,
        },
      }),
    [data?.nftActivity?.pageInfo?.endCursor, fetchMore]
  )

  const nftActivity: ActivityEvent[] = []

  return useMemo(() => ({ nftActivity, hasNext, loadMore, loading }), [hasNext, loadMore, loading, nftActivity])
}
