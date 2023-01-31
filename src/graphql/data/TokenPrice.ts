import gql from 'graphql-tag'

gql`
  query TokenPrice($chain: Chain!, $address: String, $duration: HistoryDuration!) {
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
export type { TokenPriceQuery } from './__generated__/types-and-hooks'
