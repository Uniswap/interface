import gql from 'graphql-tag'

gql`
  query PortfolioBalances($ownerAddress: String!) {
    portfolios(ownerAddresses: [$ownerAddress]) {
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
        token {
          id
          chain
          address
          name
          symbol
          standard
          decimals
          market {
            id
            pricePercentChange(duration: DAY) {
              id
              currency
              value
            }
          }
          project {
            id
            logoUrl
            safetyLevel
            isSpam
          }
        }
      }
    }
  }
`
