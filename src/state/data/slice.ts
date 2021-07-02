import { createApi } from '@reduxjs/toolkit/query/react'
import { ClientError, gql, GraphQLClient } from 'graphql-request'
import { SupportedChainId } from 'constants/chains'
import { AppState } from 'state'
import { BaseQueryApi, BaseQueryFn } from '@reduxjs/toolkit/dist/query/baseQueryTypes'
import { DocumentNode } from 'graphql'

export const UNISWAP_V3_GRAPH_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'

export const graphqlRequestBaseQuery = (): BaseQueryFn<
  { document: string | DocumentNode; variables?: any },
  unknown,
  Pick<ClientError, 'name' | 'message' | 'stack'>,
  Partial<Pick<ClientError, 'request' | 'response'>>
> => {
  return async ({ document, variables }, { getState }: BaseQueryApi) => {
    try {
      const chainId = (getState() as AppState).application.chainId

      let client: GraphQLClient | null = null

      switch (chainId) {
        case SupportedChainId.MAINNET:
          client = new GraphQLClient(UNISWAP_V3_GRAPH_URL)
          break
        default:
          return {
            error: {
              name: 'UnsupportedChainId',
              message: `Subgraph queries again ChainId ${chainId} are not supported.`,
              stack: '',
            },
          }
      }

      return { data: await client.request(document, variables), meta: {} }
    } catch (error) {
      if (error instanceof ClientError) {
        const { name, message, stack, request, response } = error
        return { error: { name, message, stack }, meta: { request, response } }
      }
      throw error
    }
  }
}

export const client = new GraphQLClient(UNISWAP_V3_GRAPH_URL)
export const api = createApi({
  reducerPath: 'dataApi',
  baseQuery: graphqlRequestBaseQuery(),
  endpoints: (builder) => ({
    getAllV3Ticks: builder.query({
      query: ({ poolAddress, skip = 0 }) => ({
        document: gql`
          query allV3Ticks($poolAddress: String!, $skip: Int!) {
            ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }) {
              tickIdx
              liquidityNet
              price0
              price1
            }
          }
        `,
        variables: {
          poolAddress,
          skip,
        },
      }),
    }),
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
