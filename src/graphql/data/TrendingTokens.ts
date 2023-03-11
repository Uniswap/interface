import gql from 'graphql-tag'
import { useMemo } from 'react'

import { useTrendingTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName, unwrapToken } from './util'

gql`
  query TrendingTokens($chain: Chain!) {
    topTokens(pageSize: 4, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      decimals
      name
      chain
      standard
      address
      symbol
      market(currency: USD) {
        id
        volume24H: volume(duration: DAY) {
          id
          value
          currency
        }
      }
      project {
        id
        logoUrl
        safetyLevel
        markets(currencies: [USD]) {
          id
          price {
            id
            value
          }
          pricePercentChange(duration: DAY) {
            id
            currency
            value
          }
        }
      }
    }
  }
`

export default function useTrendingTokens(chainId?: number) {
  const chain = chainIdToBackendName(chainId)
  const { data, loading } = useTrendingTokensQuery({ variables: { chain } })

  return useMemo(
    () => ({ data: data?.topTokens?.map((token) => unwrapToken(chainId ?? 1, token)), loading }),
    [chainId, data?.topTokens, loading]
  )
}
