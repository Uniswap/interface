import gql from 'graphql-tag'

// TODO: Implemnt this as a refetchable fragment on tokenQuery when backend adds support
gql`
  query TokenPrice($contract: ContractInput!, $duration: HistoryDuration!) {
    tokens(contracts: [$contract]) {
      market(currency: USD) {
        price {
          value
        }
        priceHistory(duration: $duration) {
          timestamp
          value
        }
      }
    }
  }
`
export type { TokenPriceQuery } from './__generated__/types-and-hooks'
