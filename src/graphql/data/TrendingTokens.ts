import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { Chain, SearchTokensQuery, TrendingTokensQuery, useSearchTokensQuery } from './__generated__/types-and-hooks'
import { chainIdToBackendName } from './util'

gql`
  query TrendingTokens($chain: Chain!) {
    topTokens(pageSize: 4, page: 1, chain: $chain, orderBy: VOLUME) {
      decimals
      name
      chain
      standard
      address
      symbol
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
        id
        logoUrl
        safetyLevel
      }
    }
  }
`

export type TrendingToken = NonNullable<NonNullable<TrendingTokensQuery['topTokens']>[number]>
