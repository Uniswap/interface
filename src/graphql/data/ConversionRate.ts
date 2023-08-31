import gql from 'graphql-tag'

gql`
  query Convert {
    convert(fromAmount: { currency: USD, value: 1.0 }, toCurrency: JPY) {
      id
      value
      currency
    }
  }
`
