import { GQLQueries } from '@universe/api'

export const GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE = [
  GQLQueries.PortfolioBalances,
  GQLQueries.TransactionList,
  GQLQueries.NftsTab,
]
