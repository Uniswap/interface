import gql from 'graphql-tag'

gql`
  query SearchTokens($searchQuery: String!) {
    searchTokenProjects(searchQuery: $searchQuery) {
      tokens {
        id @required(action: LOG)
        decimals @required(action: LOG)
        name @required(action: LOG)
        chain @required(action: LOG)
        standard @required(action: LOG)
        address
        symbol @required(action: LOG)
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
      }
      logoUrl
    }
  }
`
