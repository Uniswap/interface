import gql from 'graphql-tag'

import { TrendingTokensQuery } from './__generated__/types-and-hooks'

gql`
  query RecentlySearchedTokens($contracts: ContractInput![]!) {
    tokens(contracts: $contracts) {
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
