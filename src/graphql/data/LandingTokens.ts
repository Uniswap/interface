import gql from 'graphql-tag'
import { useMemo } from 'react'

import { useLandingTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName, unwrapToken } from './util'

gql`
  query LandingTokens($chain: Chain!) {
    topTokens(pageSize: 25, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      name
      chain
      address
      symbol
      project {
        id
        logoUrl
        safetyLevel
      }
      market(currency: USD) {
        id
        price {
          id
          value
          currency
        }
        pricePercentChange(duration: DAY) {
          id
          value
        }
        volume24H: volume(duration: DAY) {
          id
          value
          currency
        }
      }
    }
  }
`

export function useLandingTokens(chainId?: number) {
  const chain = chainIdToBackendName(chainId)
  const { data, loading } = useLandingTokensQuery({ variables: { chain } })

  return useMemo(
    () => ({ data: data?.topTokens?.map((token) => unwrapToken(chainId ?? 1, token)), loading }),
    [chainId, data?.topTokens, loading]
  )
}
