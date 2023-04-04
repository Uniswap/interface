import gql from 'graphql-tag'
import { SellOrder } from 'nft/types'
import { useCallback, useMemo, useReducer } from 'react'

import { useSellOrdersQuery } from '../__generated__/types-and-hooks'

gql`
  query SellOrders($address: String!, $tokenId: String!, $first: Int) {
    nftAssets(address: $address, filter: { listed: false, tokenIds: [$tokenId] }) {
      edges {
        node {
          tokenId
          listings(first: $first) {
            edges {
              node {
                address
                createdAt
                endAt
                id
                maker
                marketplace
                marketplaceUrl
                orderHash
                price {
                  currency
                  value
                }
                quantity
                startAt
                status
                taker
                tokenId
                type
                protocolParameters
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
      }
    }
  }
`

export function useNftSellOrders(address: string, tokenId: string, enabled: boolean) {
  const [first, incFirst] = useReducer((prev) => prev + 10, 10)
  const { data, refetch } = useSellOrdersQuery({
    variables: {
      address,
      tokenId,
      first,
    },
    skip: !enabled,
    fetchPolicy: 'no-cache',
  })

  const loadMore = useCallback(() => {
    refetch({
      first,
    })
    incFirst()
  }, [first, refetch])

  return useMemo(
    () => ({
      sellOrders: data?.nftAssets?.edges[0]?.node?.listings?.edges.map((listingNode) => {
        return {
          ...listingNode.node,
          protocolParameters: listingNode.node.protocolParameters
            ? JSON.parse(listingNode.node.protocolParameters.toString())
            : undefined,
        } as SellOrder
      }),
      hasNext: data?.nftAssets?.edges[0]?.node?.listings?.pageInfo?.hasNextPage,
      loadMore,
    }),
    [data?.nftAssets?.edges, loadMore]
  )
}
