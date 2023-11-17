import gql from 'graphql-tag'

gql`
  query TokenPrice($chain: Chain!, $address: String = null, $duration: HistoryDuration!) {
    token(chain: $chain, address: $address) {
      id
      address
      chain
      market(currency: USD) {
        id
        price {
          id
          value
        }
        priceHistory(duration: $duration) {
          id
          timestamp
          value
        }
      }
    }
  }
`

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

export type { TokenPriceQuery } from './__generated__/types-and-hooks'
