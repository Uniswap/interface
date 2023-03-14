import { WatchQueryFetchPolicy } from '@apollo/client'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import gql from 'graphql-tag'
import { ActivityEvent } from 'nft/types'
import { useCallback, useMemo } from 'react'

import { NftActivityFilterInput, useNftActivityQuery } from '../__generated__/types-and-hooks'

gql`
  query NftActivity($filter: NftActivityFilterInput, $after: String, $first: Int) {
    nftActivity(filter: $filter, after: $after, first: $first) {
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

export function useNftActivity(filter: NftActivityFilterInput, first?: number, fetchPolicy?: WatchQueryFetchPolicy) {
  const isNftGraphqlEnabled = useNftGraphqlEnabled()
  const { data, loading, fetchMore, error } = useNftActivityQuery({
    variables: {
      filter,
      first,
    },
    skip: !isNftGraphqlEnabled,
    fetchPolicy,
  })

  const hasNext = data?.nftActivity?.pageInfo?.hasNextPage
  const loadMore = useCallback(
    () =>
      fetchMore({
        variables: {
          after: data?.nftActivity?.pageInfo?.endCursor,
        },
      }),
    [data, fetchMore]
  )

  const nftActivity: ActivityEvent[] | undefined = useMemo(
    () =>
      data?.nftActivity?.edges?.map((queryActivity) => {
        const activity = queryActivity?.node
        const asset = activity?.asset
        return {
          collectionAddress: activity.address,
          tokenId: activity.tokenId,
          tokenMetadata: {
            name: asset?.name,
            imageUrl: asset?.image?.url,
            smallImageUrl: asset?.smallImage?.url,
            metadataUrl: asset?.metadataUrl,
            rarity: {
              primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
              providers: asset?.rarities?.map((rarity) => {
                return {
                  ...rarity,
                  provider: 'Rarity Sniper',
                }
              }),
            },
            suspiciousFlag: asset?.suspiciousFlag,
            standard: asset?.nftContract?.standard,
          },
          eventType: activity.type,
          marketplace: activity.marketplace,
          fromAddress: activity.fromAddress,
          toAddress: activity.toAddress,
          transactionHash: activity.transactionHash,
          orderStatus: activity.orderStatus,
          price: activity.price?.value.toString(),
          symbol: asset?.collection?.image?.url,
          quantity: activity.quantity,
          url: activity.url,
          eventTimestamp: activity.timestamp * 1000,
        }
      }),
    [data]
  )

  return useMemo(
    () => ({ nftActivity, hasNext, loadMore, loading, error }),
    [hasNext, loadMore, loading, nftActivity, error]
  )
}
