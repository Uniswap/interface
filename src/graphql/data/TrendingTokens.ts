import gql from 'graphql-tag'
import { useMemo } from 'react'

import { TrendingTokensQuery, useTrendingTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName, ChainReplace, isInterfaceSupportedGqlChain, unwrapToken } from './util'

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
      project {
        id
        logoUrl
        safetyLevel
      }
    }
  }
`

export default function useTrendingTokens(chainId?: number) {
  const chain = chainIdToBackendName(chainId)
  const { data, loading } = useTrendingTokensQuery({ variables: { chain } })
  const topTokens = data?.topTokens?.filter((token) => isInterfaceSupportedGqlChain(token.chain)) as ChainReplace<
    TrendingTokensQuery['topTokens']
  >

  return useMemo(
    () => ({ data: topTokens?.map((token) => unwrapToken(chainId ?? 1, token)), loading }),
    [chainId, topTokens, loading]
  )
}
