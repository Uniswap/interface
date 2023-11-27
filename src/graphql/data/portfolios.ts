import gql from 'graphql-tag'

import { PortfolioTokenBalancePartsFragment } from './__generated__/types-and-hooks'

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
      }
    }
  }
`

export type PortfolioToken = NonNullable<PortfolioTokenBalancePartsFragment['token']>
