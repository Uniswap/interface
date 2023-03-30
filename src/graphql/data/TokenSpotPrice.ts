import gql from 'graphql-tag'

gql`
  query TokenSpotPrice($chain: Chain!, $address: String = null) {
    token(chain: $chain, address: $address, _fs: "DATASOURCE:LEGACY") {
      id
      address
      chain
      name
      symbol
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
