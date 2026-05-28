import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'

import { useQueryClient } from 'appGraphql/data/apollo/client'
import { TokenTransactionType } from 'appGraphql/data/useTokenTransactions'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const GET_TOKEN_TRANSACTIONS = () => {
  const queryString = `
    query GetTransactions(
      $after: String, 
      $limit: Int, 
      $orderBy: String = "timestamp", 
      $orderDirection: String = "desc",
      $where: poolTransactionFilter,
      $tokenId: String!
    ) {
      token(id: $tokenId) {
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

const TokenTransactionDefaultQuerySize = 25

// const where = {
//   where: {
//     OR: [
//       {
//         AND: [
//           { token0Id: 'Token:ETHEREUM_0x0492560fa7cfd6a85e50d8be3f77318994f8f429' },
//           { token0Quantity_starts_with: '-' },
//         ],
//       },
//       {
//         AND: [
//           { token1Id: 'Token:ETHEREUM_0x0492560fa7cfd6a85e50d8be3f77318994f8f429' },
//           { token1Quantity_starts_with: '-' },
//         ],
//       },
//     ],
//   },
// }

export function useRingTokenTransactionsQuery(variables: {
  address: string
  chain: Chain
  filter: TokenTransactionType[]
  after?: string
}) {
  const client = useQueryClient(variables.chain)
  const tokenId = `Token:${variables.chain}_${variables.address.toLowerCase()}`
  const where = {
    // OR: variables.filter,
    OR: [{ token0Id: tokenId }, { token1Id: tokenId }],
  }

  return useQuery(GET_TOKEN_TRANSACTIONS(), {
    variables: {
      tokenId,
      limit: TokenTransactionDefaultQuerySize,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      where,
      after: variables.after,
    },
    fetchPolicy: 'cache-and-network',
    client,
  })
}
