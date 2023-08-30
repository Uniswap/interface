import gql from 'graphql-tag'

gql`
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
        id
        quantity
        denominatedValue {
          id
          currency
          value
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
    }
  }
`
