import graphql from 'babel-plugin-relay/macro'
import environment from 'graphql/data/RelayEnvironment'
import { fetchQuery } from 'react-relay'

import { TrendingTokensQuery } from './__generated__/TrendingTokensQuery.graphql'
import { chainIdToBackendName, unwrapToken } from './util'

export const trendingTokenQuery = graphql`
  query TrendingTokensQuery($numTokens: Int!, $chain: Chain!) {
    topTokens(pageSize: $numTokens, page: 1, chain: $chain, orderBy: VOLUME) {
      id @required(action: LOG)
      decimals @required(action: LOG)
      name @required(action: LOG)
      chain @required(action: LOG)
      address
      symbol @required(action: LOG)
      market(currency: USD) {
        price {
          value
          currency
        }
        pricePercentChange(duration: DAY) {
          value
        }
        volume24H: volume(duration: DAY) {
          value
          currency
        }
      }
      project {
        logoUrl
      }
    }
  }
`

export type TrendingToken = NonNullable<NonNullable<TrendingTokensQuery['response']['topTokens']>[number]>
export async function getTrendingTokens(numTokens: number, chainId: number) {
  const chain = chainIdToBackendName(chainId)
  const response = await fetchQuery<TrendingTokensQuery>(
    environment,
    trendingTokenQuery,
    {
      numTokens,
      chain,
    },
    { fetchPolicy: 'store-or-network' }
  ).toPromise()
  const tokens = response?.topTokens?.filter((t): t is TrendingToken => t !== null).map((t) => unwrapToken(chainId, t))

  return tokens ?? []
}
