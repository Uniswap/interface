/* eslint-disable import/no-unused-modules */
import { ErrorPolicy, useQuery } from '@apollo/client'
import { useQueryClient } from 'appGraphql/data/apollo/client'
import gql from 'graphql-tag'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

const SEARCH_DETAIL = () => {
  const queryString = `
    query tokenDetail($searchQuery: String){
      tokens(where: {OR: [{address: $searchQuery}, {indexText_contains: $searchQuery}]}) {
        items {
          id
          chain
          name
          symbol
          decimals
          address
          standard
          originToken {
            address
            name
            symbol
            decimals
            standard
          }
        }
      }
      v2Pairs(where: {OR: [{address: $searchQuery}, {indexText_contains: $searchQuery}]}) {
        items {
          id
          chain
          address
          protocolVersion
          token0 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
          token1 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
        }
      }
      v3Pools(where: {OR: [{address: $searchQuery}, {indexText_contains: $searchQuery}]}) {
        items {
          id
          chain
          address
          protocolVersion
          feeTier
          token0 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
          token1 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
        }
      }
      v4Pools(where: {OR: [{poolId: $searchQuery}, {indexText_contains: $searchQuery}]}) {
        items {
          id
          chain
          poolId
          protocolVersion
          feeTier
          token0 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
          token1 {
            id
            chain
            address
            symbol
            name
            decimals
            standard
            originToken {
              address
              name
              symbol
              decimals
              standard
            }
          }
        }
      }
    }
  `
  return gql(queryString)
}

export function useSearchRingWebQuery({
  variables,
  skip = false,
  errorPolicy = 'all',
}: {
  variables: { searchQuery: string; chain: Chain }
  skip?: boolean
  errorPolicy?: ErrorPolicy
}) {
  const client = useQueryClient(variables.chain)

  return useQuery(SEARCH_DETAIL(), {
    variables: {
      searchQuery: variables.searchQuery.toLowerCase(),
    },
    skip,
    errorPolicy,
    fetchPolicy: 'cache-and-network',
    client,
  })
}
