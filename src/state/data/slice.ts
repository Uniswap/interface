import { createApi } from '@reduxjs/toolkit/query/react'
import { ClientError, gql, GraphQLClient } from 'graphql-request'
import { FeeAmount } from '@uniswap/v3-sdk'
import { reduce } from 'lodash'

import { FeeTierDistribution, PoolTVL } from './types'
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
    getFeeTierDistribution: builder.query<FeeTierDistribution, { token0: string; token1: string }>({
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
      transformResponse: (poolTvl: PoolTVL) => {
        const all = poolTvl.asToken0.concat(poolTvl.asToken1)

        // sum tvl for token0 and token1 by fee tier
        const tvlByFeeTer = all.reduce<{ [feeAmount: number]: [number | undefined, number | undefined] }>(
          (acc, value) => {
            acc[value.feeTier][0] = (acc[value.feeTier][0] ?? 0) + Number(value.totalValueLockedToken0)
            acc[value.feeTier][1] = (acc[value.feeTier][1] ?? 0) + Number(value.totalValueLockedToken1)
            return acc
          },
          {
            [FeeAmount.LOW]: [undefined, undefined],
            [FeeAmount.MEDIUM]: [undefined, undefined],
            [FeeAmount.HIGH]: [undefined, undefined],
          }
        )

        // sum total tvl for token0 and token1
        const [sumToken0Tvl, sumToken1Tvl] = reduce(
          tvlByFeeTer,
          (acc: [number, number], value) => {
            acc[0] += value[0] ?? 0
            acc[1] += value[1] ?? 0
            return acc
          },
          [0, 0]
        )

        // returns undefined if both tvl0 and tvl1 are undefined (pool not created)
        const mean = (tvl0: number | undefined, sumTvl0: number, tvl1: number | undefined, sumTvl1: number) =>
          tvl0 === undefined && tvl1 === undefined ? undefined : ((tvl0 ?? 0) + (tvl1 ?? 0)) / (sumTvl0 + sumTvl1) || 0

        return {
          block: poolTvl._meta.block.number,
          distributions: {
            [FeeAmount.LOW]: mean(
              tvlByFeeTer[FeeAmount.LOW][0],
              sumToken0Tvl,
              tvlByFeeTer[FeeAmount.LOW][1],
              sumToken1Tvl
            ),
            [FeeAmount.MEDIUM]: mean(
              tvlByFeeTer[FeeAmount.MEDIUM][0],
              sumToken0Tvl,
              tvlByFeeTer[FeeAmount.MEDIUM][1],
              sumToken1Tvl
            ),
            [FeeAmount.HIGH]: mean(
              tvlByFeeTer[FeeAmount.HIGH][0],
              sumToken0Tvl,
              tvlByFeeTer[FeeAmount.HIGH][1],
              sumToken1Tvl
            ),
          },
        }
      },
    }),
  }),
})

export const { useGetFeeTierDistributionQuery } = api
