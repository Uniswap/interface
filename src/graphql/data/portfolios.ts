import gql from 'graphql-tag'

import { TokenBalance } from './__generated__/types-and-hooks'

gql`
  fragment PortfolioTokenBalanceParts on TokenBalance {
    id
    quantity
    denominatedValue {
      id
      currency
      value
    }
    token {
      id
      chain
      address
      name
      symbol
      standard
      decimals
    }
  }

  query PortfolioBalances($ownerAddress: String!, $chains: [Chain!]!) {
    portfolios(ownerAddresses: [$ownerAddress], chains: $chains) {
      id
      tokensTotalDenominatedValue {
        id
        value
      }
      tokensTotalDenominatedValueChange(duration: DAY) {
        absolute {
          id
          value
        }
        percentage {
          id
          value
        }
      }
      tokenBalances {
        ...PortfolioTokenBalanceParts
        tokenProjectMarket {
          id
          pricePercentChange(duration: DAY) {
            id
            value
          }
          tokenProject {
            id
            logoUrl
            isSpam
          }
        }
      }
    }
  }
`

export type PortfolioToken = NonNullable<TokenBalance['token']>
