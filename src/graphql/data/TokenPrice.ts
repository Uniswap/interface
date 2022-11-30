import graphql from 'babel-plugin-relay/macro'

// TODO: Implemnt this as a refetchable fragment on tokenQuery when backend adds support
export const tokenPriceQuery = graphql`
  query TokenPriceQuery($contract: ContractInput!, $duration: HistoryDuration!) {
    tokens(contracts: [$contract]) {
      market(currency: USD) @required(action: LOG) {
        price {
          value @required(action: LOG)
        }
        priceHistory(duration: $duration) {
          timestamp @required(action: LOG)
          value @required(action: LOG)
        }
      }
    }
  }
`
export type { TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
