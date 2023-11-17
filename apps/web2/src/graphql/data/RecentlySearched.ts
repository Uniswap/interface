import gql from 'graphql-tag'

gql`
  query RecentlySearchedAssets($collectionAddresses: [String!]!, $contracts: [ContractInput!]!) {
    nftCollections(filter: { addresses: $collectionAddresses }) {
      edges {
        node {
          collectionId
          image {
            url
          }
          isVerified
          name
          numAssets
          nftContracts {
            address
          }
          markets(currencies: ETH) {
            floorPrice {
              currency
              value
            }
          }
        }
      }
    }
    tokens(contracts: $contracts) {
      id
      decimals
      name
      chain
      standard
      address
      symbol
      market(currency: USD) {
        id
        price {
          id
          value
          currency
        }
        pricePercentChange(duration: DAY) {
          id
          value
        }
        volume24H: volume(duration: DAY) {
          id
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
