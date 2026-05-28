import { useSelector } from 'react-redux'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'

export function useMostRecentSwapTx(address: Address): TransactionDetails | undefined {
  const transactions = useSelector(selectTransactions)
  const addressTransactions = transactions[address]
  if (!addressTransactions) {
    return undefined
  }
  return flattenObjectOfObjects(addressTransactions)
    .filter((tx) => tx.typeInfo.type === TransactionType.Swap)
    .sort((a, b) => b.addedTime - a.addedTime)[0]
}
