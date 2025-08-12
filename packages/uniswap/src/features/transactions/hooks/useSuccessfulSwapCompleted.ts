import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const ACCEPTABLE_TIME_DIFF = 5 * ONE_SECOND_MS

export function useSuccessfulSwapCompleted(onSwapCompleted: (transaction: TransactionDetails) => void): void {
  const { evmAccount } = useWallet()
  const transactions = useSelector(selectTransactions)

  const successfulSwapTransactions = useMemo((): TransactionDetails[] => {
    if (!evmAccount?.address) {
      return []
    }

    const swapTransactions: TransactionDetails[] = []

    flattenObjectOfObjects(transactions).forEach((tx) =>
      Object.values(tx).forEach((txNested) => {
        if (
          txNested.typeInfo.type === TransactionType.Swap &&
          txNested.status === TransactionStatus.Success &&
          txNested.from === evmAccount.address
        ) {
          swapTransactions.push(txNested)
        }
      }),
    )
    return swapTransactions
  }, [evmAccount?.address, transactions])

  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0)

  useEffect(() => {
    const lastCompletedSwap = successfulSwapTransactions.sort((a, b) => (b.addedTime || 0) - (a.addedTime || 0))[0]

    // if a completed swap and it was added in the last ACCEPTABLE_TIME_DIFF seconds, trigger the callback
    if (
      lastCompletedSwap &&
      lastCompletedSwap.receipt?.confirmedTime &&
      lastCompletedSwap.receipt.confirmedTime > lastProcessedTimestamp
    ) {
      const timeSinceAdded = Date.now() - (lastCompletedSwap.receipt.confirmedTime || 0)
      if (timeSinceAdded < ACCEPTABLE_TIME_DIFF) {
        onSwapCompleted(lastCompletedSwap)
        setLastProcessedTimestamp(lastCompletedSwap.receipt.confirmedTime)
      }
    }
  }, [successfulSwapTransactions, lastProcessedTimestamp, onSwapCompleted])
}
