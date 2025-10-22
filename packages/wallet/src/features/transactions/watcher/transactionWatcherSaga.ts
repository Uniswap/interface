import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { fork, put, select, take } from 'typed-redux-saga'
import { FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { selectIncompleteTransactions } from 'uniswap/src/features/transactions/selectors'
import { addTransaction, transactionActions, updateTransaction } from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { QueuedOrderStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { isFORTransaction } from 'wallet/src/features/transactions/utils'
import { OrderWatcher } from 'wallet/src/features/transactions/watcher/orderWatcherSaga'
import { watchFiatOnRampTransaction } from 'wallet/src/features/transactions/watcher/watchFiatOnRampSaga'
import { watchTransaction } from 'wallet/src/features/transactions/watcher/watchOnChainTransactionSaga'

/**
 * Main transaction watcher saga.
 * Orchestrates watching for new/updated transactions and forks specific watchers based on transaction type.
 */
export function* transactionWatcher({
  apolloClient,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
}): Generator<unknown> {
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting transaction watcher')

  // Start the order watcher to allow off-chain order updates to propagate to watchTransaction
  yield* fork(OrderWatcher.initialize)

  // First, fork off watchers for any incomplete txs that are already in store
  // This allows us to detect completions if a user closed the app before a tx finished
  const incompleteTransactions = yield* select(selectIncompleteTransactions)
  for (const transaction of incompleteTransactions) {
    if (isFORTransaction(transaction)) {
      yield* fork(watchFiatOnRampTransaction, transaction as FORTransactionDetails)
    } else {
      // If the transaction was a queued UniswapX order that never became submitted, update UI to show failure
      if (isUniswapX(transaction) && transaction.queueStatus === QueuedOrderStatus.Waiting) {
        const updatedOrder = { ...transaction, queueStatus: QueuedOrderStatus.AppClosed }
        yield* put(transactionActions.updateTransaction(updatedOrder))
        continue
      }

      yield* fork(watchTransaction, { transaction, apolloClient })
    }
  }

  // Next, start watching for new or updated transactions dispatches
  while (true) {
    const { payload: transaction } = yield* take<
      ReturnType<typeof addTransaction> | ReturnType<typeof updateTransaction>
    >([addTransaction.type, updateTransaction.type])
    try {
      if (isFORTransaction(transaction)) {
        yield* fork(watchFiatOnRampTransaction, transaction as FORTransactionDetails)
      } else {
        yield* fork(watchTransaction, { transaction, apolloClient })
      }
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'transactionWatcherSaga',
          function: 'transactionWatcher',
        },
        extra: { txHash: transaction.hash, txId: transaction.id, chainId: transaction.chainId },
      })

      // Push a generic error notification if watching fails unexpectedly
      yield* put(
        pushNotification({
          type: AppNotificationType.Error,
          address: transaction.from,
          errorMessage: i18n.t('transaction.watcher.error.status'),
        }),
      )
    }
  }
}
