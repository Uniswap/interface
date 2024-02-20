import gql from 'graphql-tag'

gql`
  query TokenHistoricalVolumes($chain: Chain!, $address: String = null, $duration: HistoryDuration!) {
    token(chain: $chain, address: $address) {
      id
      address
      chain
      market(currency: USD) {
        id
        historicalVolume(duration: $duration) {
          id
          timestamp
          value
        }
      }
    }
  }

  query TokenHistoricalTvls($chain: Chain!, $address: String = null, $duration: HistoryDuration!) {
    token(chain: $chain, address: $address) {
      id
      address
      chain
      market(currency: USD) {
        id
        historicalTvl(duration: $duration) {
          id
          timestamp
          value
        }
      }
    }
  }
`
