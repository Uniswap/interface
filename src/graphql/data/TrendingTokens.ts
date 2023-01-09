import gql from 'graphql-tag'

gql`
  query TrendingTokens($chain: Chain!) {
    topTokens(pageSize: 4, page: 1, chain: $chain, orderBy: VOLUME) {
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
