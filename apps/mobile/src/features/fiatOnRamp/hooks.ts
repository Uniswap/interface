import { useCallback, useRef } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { addTransaction } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { createTransactionId } from 'src/features/transactions/utils'

/** Returns a new externalTransactionId and a callback to store the transaction. */
export function useFiatOnRampTransactionCreator(ownerAddress: string): {
  externalTransactionId: string
  dispatchAddTransaction: () => void
} {
  const dispatch = useAppDispatch()

  const externalTransactionId = useRef(createTransactionId())

  const dispatchAddTransaction = useCallback(() => {
    // adds a dummy transaction detail for now
    // later, we will attempt to look up information for that id
    const transactionDetail: TransactionDetails = {
      chainId: ChainId.Mainnet,
      id: externalTransactionId.current,
      from: ownerAddress,
      typeInfo: { type: TransactionType.FiatPurchase, syncedWithBackend: false },
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      hash: '',
      options: { request: {} },
    }
    // use addTransaction action so transactionWatcher picks it up
    dispatch(addTransaction(transactionDetail))
  }, [dispatch, externalTransactionId, ownerAddress])

  return { externalTransactionId: externalTransactionId.current, dispatchAddTransaction }
}
