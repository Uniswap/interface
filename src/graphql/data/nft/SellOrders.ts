import gql from 'graphql-tag'
import { SellOrder } from 'nft/types'
import { useMemo } from 'react'

import { NftAsset, useSellOrdersQuery } from '../__generated__/types-and-hooks'

gql`
  query SellOrders($address: String!, $tokenId: String!) {
    nftAssets(address: $address, filter: { listed: false, tokenIds: [$tokenId] }) {
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

export function useNftSellOrders(address: string, tokenId: string, enabled: boolean) {
  const { data } = useSellOrdersQuery({
    variables: {
      address,
      tokenId,
    },
    skip: !enabled,
    fetchPolicy: 'no-cache',
  })

  const asset = data?.nftAssets?.edges[0]?.node as NonNullable<NftAsset> | undefined

  return useMemo(
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
}
