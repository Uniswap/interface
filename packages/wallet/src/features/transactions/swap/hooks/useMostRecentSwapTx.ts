import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import { useAppSelector } from 'wallet/src/state'

export function useMostRecentSwapTx(address: Address): TransactionDetails | undefined {
  const transactions = useAppSelector(selectTransactions)
  const addressTransactions = transactions[address]
  if (addressTransactions) {
    return flattenObjectOfObjects(addressTransactions)
      .filter((tx) => tx.typeInfo.type === TransactionType.Swap)
      .sort((a, b) => b.addedTime - a.addedTime)[0]
  }
}
