import { refetchQueriesViaOnchainOverrideVariant } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchQueriesViaOnchainOverrideVariantSaga'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

// oxlint-disable-next-line typescript/explicit-function-return-type
export function* refetchQueries({
  transaction,
  activeAddress,
}: {
  transaction: TransactionDetails
  activeAddress: string | null
}) {
  yield* refetchQueriesViaOnchainOverrideVariant({ transaction, activeAddress })
}
