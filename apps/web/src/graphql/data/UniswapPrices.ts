import gql from 'graphql-tag'

gql`
  query UniswapPrices($contracts: [ContractInput!]!) {
    tokens(contracts: $contracts) {
      id
      address
      chain
      standard
      project {
        id
        markets(currencies: [USD]) {
          id
          price {
            id
            value
          }
        }
      }
    }
  }
`
