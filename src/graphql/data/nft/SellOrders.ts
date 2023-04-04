import gql from 'graphql-tag'
import { SellOrder } from 'nft/types'
import { useCallback, useMemo, useReducer } from 'react'

import { NftAsset, useSellOrdersQuery } from '../__generated__/types-and-hooks'

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

  const asset = data?.nftAssets?.edges[0]?.node as NonNullable<NftAsset> | undefined

  const hasNext = asset?.listings?.pageInfo?.hasNextPage
  const loadMore = useCallback(() => {
    refetch({
      first,
    })
    incFirst()
  }, [first, refetch])

  const sellOrders = useMemo(
    () =>
      asset?.listings?.edges.map((listingNode) => {
        return {
          ...listingNode.node,
          protocolParameters: listingNode.node.protocolParameters
            ? JSON.parse(listingNode.node.protocolParameters.toString())
            : undefined,
        } as SellOrder
      }),
    [asset]
  )

  return useMemo(() => ({ sellOrders, hasNext, loadMore }), [sellOrders, hasNext, loadMore])
}
