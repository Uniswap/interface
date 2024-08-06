import { useSelector } from 'react-redux'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'

export function useMostRecentSwapTx(address: Address): TransactionDetails | undefined {
  const transactions = useSelector(selectTransactions)
  const addressTransactions = transactions[address]
  if (addressTransactions) {
    return flattenObjectOfObjects(addressTransactions)
      .filter((tx) => tx.typeInfo.type === TransactionType.Swap)
      .sort((a, b) => b.addedTime - a.addedTime)[0]
  }
}
