import { Text } from 'ui/src'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks'
import { TransactionDetails } from 'wallet/src/features/transactions/types'

export function TransactionActivity({ address }: { address: Address }): JSX.Element {
  // TODO merge with local history in followup work
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } =
    useFormattedTransactionDataForActivity(
      address,
      false,
      (_: string, transactions: TransactionDetails[]) => transactions
    )

  return <Text variant="subheadSmall">Activity</Text>
}
