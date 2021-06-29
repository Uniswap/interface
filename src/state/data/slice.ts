import { createApi } from '@reduxjs/toolkit/query/react'
import { gql, GraphQLClient } from 'graphql-request'
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query'

export const UNISWAP_V3_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'

export const client = new GraphQLClient(UNISWAP_V3_GRAPH_URL)
export const api = createApi({
  reducerPath: 'dataApi',
  baseQuery: graphqlRequestBaseQuery({ client }),
  endpoints: (builder) => ({
    getFeeTierDistribution: builder.query({
      query: ({ token0, token1 }) => ({
        document: gql`
          query pools($token0: String!, $token1: String!) {
            _meta {
              block {
                number
              }
            }
            asToken0: pools(
              orderBy: totalValueLockedToken0
              orderDirection: desc
              where: { token0: $token0, token1: $token1 }
            ) {
              feeTier
              totalValueLockedToken0
              totalValueLockedToken1
            }
            asToken1: pools(
              orderBy: totalValueLockedToken0
              orderDirection: desc
              where: { token0: $token1, token1: $token0 }
            ) {
              feeTier
              totalValueLockedToken0
              totalValueLockedToken1
            }
          }
        `,
        variables: {
          token0,
          token1,
        },
      }),
    }),
  }),
})

export const { useGetFeeTierDistributionQuery } = api
