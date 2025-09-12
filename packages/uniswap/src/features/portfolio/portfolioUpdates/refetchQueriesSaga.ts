import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { refetchRestQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/rest/refetchRestQueriesViaOnchainOverrideVariantSaga'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export function* refetchQueries({
  transaction,
  apolloClient,
  activeAddress,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
}) {
  yield* refetchRestQueriesViaOnchainOverrideVariant({ transaction, apolloClient, activeAddress })
}
