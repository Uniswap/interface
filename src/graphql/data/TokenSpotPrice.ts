import gql from 'graphql-tag'

gql`
  query TokenSpotPrice($chain: Chain!, $address: String = null) {
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
      }
    }
  }
`
