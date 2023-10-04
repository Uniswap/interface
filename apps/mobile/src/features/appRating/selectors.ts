import { createSelector, Selector } from '@reduxjs/toolkit'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { selectTransactions } from 'wallet/src/features/transactions/selectors'
import { TransactionStateMap } from 'wallet/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { RootState } from 'wallet/src/state'

const NUM_CONSECUTIVE_SWAPS_BEFORE_PROMPT = 2

export const hasConsecutiveSuccessfulSwapsSelector: Selector<RootState, boolean> = createSelector(
  [selectTransactions, (state: RootState): number => state.wallet.appRatingPromptedMs ?? 0],
  (transactions: TransactionStateMap, appRatingPromptedMs): boolean => {
    const swapTxs: Array<TransactionDetails> = []

    const txs = flattenObjectOfObjects(transactions)
    for (const tx of txs) {
      for (const transaction of Object.values(tx)) {
        // ignore transactions completed before last prompt
        if (transaction.addedTime < appRatingPromptedMs) continue

        if (transaction.typeInfo.type === TransactionType.Swap) swapTxs.push(transaction)
      }
    }

    return (
      swapTxs.length >= NUM_CONSECUTIVE_SWAPS_BEFORE_PROMPT &&
      swapTxs
        .slice(-NUM_CONSECUTIVE_SWAPS_BEFORE_PROMPT)
        .every((tx) => tx.status === TransactionStatus.Success)
    )
  }
)
