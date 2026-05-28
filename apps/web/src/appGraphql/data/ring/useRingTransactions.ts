import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { useQueryClient } from 'appGraphql/data/apollo/client'
import { Chain, PoolTransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const GET_TRANSACTIONS = () => {
  const queryString = `
    query GetTransactions(
      $after: String, 
      $limit: Int, 
      $orderBy: String = "timestamp", 
      $orderDirection: String = "desc",
      $where: poolTransactionFilter
    ) {
      poolTransactions(
        after: $after
        limit: $limit
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        items {
          id
          chain
          protocolVersion
          type
          account
          hash
          timestamp
          token0Quantity
          token1Quantity
          usdValue
          token0 {
            id
            chain
            address
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          token1 {
            id
            chain
            address
            originToken {
              address
              name
              symbol
              decimals
            }
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
      }
    }
  `
  return gql(queryString)
}

export function useRingTransactionsQuery(variables: {
  chain: Chain
  type?: { type: PoolTransactionType }[]
  after?: string
  limit?: number
  orderBy?: string
  orderDirection?: string
  skip?: boolean
}) {
  const client = useQueryClient(variables.chain)
  const where = {
    OR: variables.type,
  }

  return useQuery(GET_TRANSACTIONS(), {
    variables: {
      after: variables.after,
      limit: variables.limit,
      orderBy: variables.orderBy,
      orderDirection: variables.orderDirection,
      where,
    },
    fetchPolicy: 'cache-and-network',
    client,
  })
}
