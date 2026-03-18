import { createSelector, Selector } from '@reduxjs/toolkit'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { TransactionsState } from 'uniswap/src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { ONE_DAY_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'
import {
  appRatingFeedbackProvidedMsSelector,
  appRatingPromptedMsSelector,
  appRatingProvidedMsSelector,
} from 'wallet/src/features/wallet/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

const NUM_CONSECUTIVE_SWAPS = 2
// at most once per reminder period (120 days)
export const MIN_PROMPT_REMINDER_MS = 120 * ONE_DAY_MS
// remind after a longer delay when user filled the feedback form (180 days)
export const MIN_FEEDBACK_REMINDER_MS = 180 * ONE_DAY_MS

export const hasConsecutiveRecentSwapsSelector: Selector<WalletState, boolean> = createSelector(
  [selectTransactions, (state: WalletState): number => state.wallet.appRatingPromptedMs ?? 0],
  (transactions: TransactionsState, appRatingPromptedMs): boolean => {
    const swapTxs: Array<TransactionDetails> = []

    const txs = flattenObjectOfObjects(transactions)
    for (const tx of txs) {
      for (const transaction of Object.values(tx)) {
        // ignore transactions completed before last prompt
        if (transaction.addedTime < appRatingPromptedMs) {
          continue
        }

        if (transaction.typeInfo.type === TransactionType.Swap) {
          swapTxs.push(transaction)
        }
      }
    }

    // Sort transactions by time, most recent first
    const sortedSwaps = [...swapTxs].sort((a, b) => b.addedTime - a.addedTime)
    const recentSwaps = sortedSwaps.slice(0, NUM_CONSECUTIVE_SWAPS)
    const mostRecentSwapTime = recentSwaps[0]?.addedTime
    const mostRecentSwapLessThanMinAgo = Boolean(mostRecentSwapTime && Date.now() - mostRecentSwapTime < ONE_MINUTE_MS)

    return (
      swapTxs.length >= NUM_CONSECUTIVE_SWAPS &&
      recentSwaps.every((tx) => tx.status === TransactionStatus.Success) &&
      mostRecentSwapLessThanMinAgo
    )
  },
)

/**
 * Selector that determines if and when to show the app rating prompt.
 * The prompt should be shown when ALL of these conditions are met:
 * 1. User has completed consecutive successful swaps recently (consecutiveSwapsCondition)
 * 2. Either:
 *    a. User has never been prompted before (hasNeverPrompted), OR
 *    b. Enough time has passed since the last interaction:
 *       - If user never provided feedback: 120 days since last prompt
 *       - If user provided feedback: 180 days since feedback was given
 *
 * Returns state including prompt timing info and whether prompt should be shown.
 */
export const appRatingStateSelector: Selector<
  WalletState,
  {
    appRatingProvidedMs: number | undefined
    appRatingPromptedMs: number | undefined
    consecutiveSwapsCondition: boolean
    shouldPrompt: boolean
  }
> = createSelector(
  [
    appRatingProvidedMsSelector,
    appRatingPromptedMsSelector,
    appRatingFeedbackProvidedMsSelector,
    hasConsecutiveRecentSwapsSelector,
  ],
  // eslint-disable-next-line max-params
  (appRatingProvidedMs, appRatingPromptedMs, appRatingFeedbackProvidedMs, consecutiveSwapsCondition) => {
    const hasPrompted = appRatingPromptedMs !== undefined
    const hasProvidedFeedback = appRatingFeedbackProvidedMs !== undefined

    // Check if enough time has passed since last prompt (when no feedback given)
    const hasPassedPromptDelay =
      !hasProvidedFeedback && hasPrompted && Date.now() - appRatingPromptedMs > MIN_PROMPT_REMINDER_MS

    // Check if enough time has passed since last feedback
    const hasPassedFeedbackDelay =
      hasProvidedFeedback && Date.now() - appRatingFeedbackProvidedMs > MIN_FEEDBACK_REMINDER_MS

    // Determine if we should show reminder based on all timing conditions
    const reminderCondition = !hasPrompted || hasPassedPromptDelay || hasPassedFeedbackDelay

    return {
      appRatingPromptedMs,
      appRatingProvidedMs,
      consecutiveSwapsCondition,
      shouldPrompt: consecutiveSwapsCondition && reminderCondition,
    }
  },
)
