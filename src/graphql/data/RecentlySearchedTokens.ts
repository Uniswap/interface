import gql from 'graphql-tag'

gql`
  query RecentlySearchedTokens($contracts: [ContractInput!]!) {
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
