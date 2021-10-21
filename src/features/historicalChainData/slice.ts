import { BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
import { ClientError, gql, GraphQLClient } from 'graphql-request'
import { DocumentNode } from 'graphql/language'
import { SupportedChainId } from 'src/constants/chains'

// List of supported subgraphs
const CHAIN_SUBGRAPH_URL: Record<number, string> = {
  [SupportedChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [SupportedChainId.RINKEBY]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [SupportedChainId.ARBITRUM_ONE]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
  [SupportedChainId.OPTIMISM]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-optimism-dev',
}

interface TokenPriceHourlyVariables {
  address: string
  chainId: number
  startTime: number
  skip: number
}

export const historicalChainData = createApi({
  reducerPath: 'historicalChainData',
  baseQuery: graphqlRequestBaseQuery(),
  endpoints: (builder) => ({
    tokenPriceHourly: builder.query({
      query: (variables: TokenPriceHourlyVariables) => ({
        document: gql`
          query tokenHourDatas($address: String!, $startTime: Int!, $skip: Int!) {
            tokenHourDatas(
              first: 100
              skip: $skip
              where: { token: $address, periodStartUnix_gt: $startTime }
              orderBy: periodStartUnix
              orderDirection: asc
            ) {
              periodStartUnix
              high
              low
              open
              close
            }
          }
        `,
        variables,
      }),
    }),
  }),
})

// Graphql query client wrapper that builds a dynamic url based on chain id
function graphqlRequestBaseQuery(): BaseQueryFn<
  { document: string | DocumentNode; variables?: TokenPriceHourlyVariables },
  unknown,
  Pick<ClientError, 'name' | 'message' | 'stack'>,
  Partial<Pick<ClientError, 'request' | 'response'>>
> {
  return async ({ document, variables }) => {
    try {
      const chainId = variables?.chainId

      const subgraphUrl = chainId ? CHAIN_SUBGRAPH_URL[chainId] : undefined

      if (!subgraphUrl) {
        return {
          error: {
            name: 'UnsupportedChainId',
            message: `Subgraph queries against ChainId ${chainId} are not supported.`,
            stack: '',
          },
        }
      }
      return { data: await new GraphQLClient(subgraphUrl).request(document, variables), meta: {} }
    } catch (error) {
      if (error instanceof ClientError) {
        const { name, message, stack, request, response } = error
        return { error: { name, message, stack }, meta: { request, response } }
      }
      throw error
    }
  }
}
