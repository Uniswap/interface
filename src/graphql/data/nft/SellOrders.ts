import graphql from 'babel-plugin-relay/macro'
import { SellOrder } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import { fetchQuery, useRelayEnvironment } from 'react-relay'
import { Subscription } from 'relay-runtime'

import { DetailsSellOrdersQuery } from './__generated__/DetailsSellOrdersQuery.graphql'

const sellOrdersQuery = graphql`
  query SellOrdersQuery($address: String!, $tokenId: String!) {
    nftAssets(address: $address, filter: { tokenIds: [$tokenId] }) {
      edges {
        node {
          listings(first: 10) {
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
              cursor
            }
          }
        }
      }
    }
  }
`

export function useSellOrdersQuery(
  address: string,
  tokenId: string,
  enabled: boolean
): { sellOrders: SellOrder[] | undefined; isLoading: boolean } {
  const environment = useRelayEnvironment()
  const [sellOrders, setSellOrders] = useState<SellOrder[] | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let subscription: Subscription | undefined

    if (enabled) {
      subscription = fetchQuery<DetailsSellOrdersQuery>(environment, sellOrdersQuery, {
        address,
        tokenId,
      }).subscribe({
        next(data) {
          const asset = data.nftAssets?.edges[0]?.node
          const queriedSellOrders = asset?.listings?.edges.map((listingNode) => {
            return {
              ...listingNode.node,
              protocolParameters: listingNode.node.protocolParameters
                ? JSON.parse(listingNode.node.protocolParameters.toString())
                : undefined,
            } as SellOrder
          })
          setSellOrders(queriedSellOrders)
        },
        complete: () => setIsLoading(false),
      })
    }

    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [address, enabled, environment, tokenId])

  return useMemo(
    () => ({
      sellOrders,
      isLoading,
    }),
    [sellOrders, isLoading]
  )
}
