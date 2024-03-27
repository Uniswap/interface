import { WatchQueryFetchPolicy } from '@apollo/client'
import { ActivityEvent } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useCallback, useMemo } from 'react'

import {
  NftActivityFilterInput,
  useNftActivityQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function useNftActivity(filter: NftActivityFilterInput, first?: number, fetchPolicy?: WatchQueryFetchPolicy) {
  const { data, loading, fetchMore, error } = useNftActivityQuery({
    variables: {
      filter,
      first,
    },
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
          price: wrapScientificNotation(activity.price?.value ?? 0),
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
