import { SwapEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumberish, providers } from 'ethers'
import appsFlyer from 'react-native-appsflyer'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { fetchFiatOnRampTransaction } from 'src/features/fiatOnRamp/api'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransactionSaga'
import { refetchGQLQueries } from 'src/features/transactions/refetchGQLQueriesSaga'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransactionSaga'
import {
  selectHasDoneASwap,
  selectIncompleteTransactions,
} from 'src/features/transactions/selectors'
import {
  addTransaction,
  cancelTransaction,
  forceFetchFiatOnRampTransactions,
  replaceTransaction,
  transactionActions,
  updateTransaction,
  upsertFiatOnRampTransaction,
} from 'src/features/transactions/slice'
import { getFinalizedTransactionStatus } from 'src/features/transactions/utils'
import { call, delay, fork, put, race, select, take } from 'typed-redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { pushNotification, setNotificationStatus } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  BaseSwapTransactionInfo,
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getProvider } from 'wallet/src/features/wallet/context'

export function* transactionWatcher() {
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting tx watcher')

  // First, fork off watchers for any incomplete txs that are already in store
  // This allows us to detect completions if a user closed the app before a tx finished
  const incompleteTransactions = yield* appSelect(selectIncompleteTransactions)
  for (const transaction of incompleteTransactions) {
    if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
      yield* fork(watchFiatOnRampTransaction, transaction)
    } else {
      yield* fork(watchTransaction, transaction)
    }
  }

  // Next, start watching for new or updated transactions dispatches
  while (true) {
    const { payload: transaction } = yield* take<ReturnType<typeof addTransaction>>([
      addTransaction.type,
      updateTransaction.type,
    ])
    try {
      if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
        yield* fork(watchFiatOnRampTransaction, transaction)
      } else {
        yield* fork(watchTransaction, transaction)
      }
    } catch (error) {
      logger.error('Failed to fork a transaction watcher', {
        tags: {
          file: 'transactionWatcherSaga',
          function: 'watchTransaction',
          txHash: transaction.hash,
          error: serializeError(error),
        },
      })

      yield* put(
        pushNotification({
          type: AppNotificationType.Error,
          address: transaction.from,
          errorMessage: i18n.t('Error while checking transaction status'),
        })
      )
    }
  }
}

export function* watchFiatOnRampTransaction(transaction: TransactionDetails) {
  // id represents `externalTransactionId` sent to Moonpay
  const { id } = transaction

  logger.debug(
    'transactionWatcherSaga',
    'watchFiatOnRampTransaction',
    'Watching for updates for fiat onramp tx:',
    id
  )

  try {
    while (true) {
      const updatedTransaction = yield* call(
        fetchFiatOnRampTransaction,
        /** previousTransactionDetails= */ transaction
      )

      if (!updatedTransaction) return

      // not strictly necessary but avoid dispatching an action if tx hasn't changed
      if (JSON.stringify(updatedTransaction) !== JSON.stringify(transaction)) {
        logger.debug(
          'transactionWatcherSaga',
          'watchFiatOnRampTransaction',
          `Updating transaction with id ${id} from status ${transaction.status} to ${updatedTransaction.status}`
        )
        yield* put(upsertFiatOnRampTransaction(updatedTransaction))
      }

      if (
        updatedTransaction.status === TransactionStatus.Failed ||
        updatedTransaction.status === TransactionStatus.Success ||
        updatedTransaction.status === TransactionStatus.Unknown
      ) {
        // Flip status to true so we can render Notification badge on home
        yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
        // can stop polling once transaction is final
        break
      }

      // at this point, we received a response from Moonpay's API
      // however, we didn't have enough information to act
      // try again after a waiting period or when we've come back from Moonpay page
      // TODO: Currently, when user closes in-app browser we would not re-fetch the data, but we should.
      //       When https://uniswaplabs.atlassian.net/browse/DATA-734 is implemented, remove `forceFetchFiatOnRampTransactions` related logic
      yield* race({
        forceFetch: take(forceFetchFiatOnRampTransactions),
        timeout: delay(PollingInterval.Normal),
      })
    }
  } catch (error) {
    logger.error('Failed while watching for a fiat on-ramp transaction', {
      tags: {
        file: 'transactionWatcherSaga',
        function: 'watchFiatOnRampTransaction',
        error: serializeError(error),
      },
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* watchTransaction(transaction: TransactionDetails): Generator<any> {
  const { chainId, id, hash, options } = transaction

  logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
  const provider = yield* call(getProvider, chainId)

  const { receipt, cancel, replace, invalidated } = yield* race({
    receipt: call(waitForReceipt, hash, provider),
    cancel: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
    invalidated: call(waitForTxnInvalidated, chainId, id, options.request.nonce),
  })

  if (cancel) {
    // reset watcher for the current txn, as it can still be mined (or invalidated by the new txn)
    yield* fork(watchTransaction, transaction)
    // Cancel the current txn, which submits a new txn on chain and monitored in state
    yield* call(attemptCancelTransaction, transaction)
    return
  }

  if (replace) {
    // Same logic as cancelation, but skip directly to replacement
    yield* fork(watchTransaction, transaction)
    yield* call(attemptReplaceTransaction, transaction, replace.newTxParams)
    return
  }

  if (invalidated) {
    yield* call(deleteTransaction, transaction)
    // Show popup if invalidated cancelation - was not mined before original txn
    if (transaction.status === TransactionStatus.Cancelling) {
      yield* put(
        pushNotification({
          type: AppNotificationType.Error,
          address: transaction.from,
          errorMessage: i18n.t('Unable to cancel transaction'),
        })
      )
    }
    return
  }

  // Update the store with tx receipt details
  yield* call(finalizeTransaction, transaction, receipt)
}

export async function waitForReceipt(
  hash: string,
  provider: providers.Provider
): Promise<providers.TransactionReceipt> {
  const txReceipt = await provider.waitForTransaction(hash)
  if (txReceipt) {
    logger.debug('transactionWatcherSaga', 'waitForTransactionReceipt', 'Tx receipt received', hash)
  }
  return txReceipt
}

function* waitForCancellation(chainId: ChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof cancelTransaction>>(cancelTransaction.type)
    if (payload.cancelRequest && payload.chainId === chainId && payload.id === id) return true
  }
}

function* waitForReplacement(chainId: ChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof replaceTransaction>>(replaceTransaction.type)
    if (payload.chainId === chainId && payload.id === id) return payload
  }
}
/**
 * Monitor for transactions with the same nonce as the current transaction. If any duplicate is finalized, it means
 * the current transaction has been invalidated and wont be picked up on chain.
 */
export function* waitForTxnInvalidated(
  chainId: ChainId,
  id: string,
  nonce: BigNumberish | undefined
) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof transactionActions.finalizeTransaction>>(
      transactionActions.finalizeTransaction.type
    )
    if (payload.chainId === chainId && payload.id !== id && payload.options.request.nonce === nonce)
      return true
  }
}

/**
 * Send analytics events for finalized transactions
 */
export function logTransactionEvent(
  actionData: ReturnType<typeof transactionActions.finalizeTransaction>
): void {
  const { payload } = actionData
  const { hash, chainId, addedTime, from, typeInfo, receipt, status } = payload
  const { gasUsed, effectiveGasPrice, confirmedTime } = receipt ?? {}
  const { type } = typeInfo

  // Send analytics event for swap success and failure
  if (type === TransactionType.Swap) {
    const swapTypeInfo = typeInfo as BaseSwapTransactionInfo
    const {
      slippageTolerance,
      quoteId,
      routeString,
      gasUseEstimate,
      inputCurrencyId,
      outputCurrencyId,
      tradeType,
    } = swapTypeInfo
    const eventName =
      status === TransactionStatus.Success
        ? SwapEventName.SWAP_TRANSACTION_COMPLETED
        : SwapEventName.SWAP_TRANSACTION_FAILED
    sendMobileAnalyticsEvent(eventName, {
      address: from,
      hash,
      chain_id: chainId,
      added_time: addedTime,
      confirmed_time: confirmedTime,
      gas_used: gasUsed,
      effective_gas_price: effectiveGasPrice,
      inputCurrencyId,
      outputCurrencyId,
      tradeType: tradeType === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
      slippageTolerance,
      gasUseEstimate,
      route: routeString,
      quoteId,
    })
  }
}

type StatusOverride =
  | TransactionStatus.Success
  | TransactionStatus.Failed
  | TransactionStatus.Cancelled

function* finalizeTransaction(
  transaction: TransactionDetails,
  ethersReceipt?: providers.TransactionReceipt | null,
  statusOverride?: StatusOverride
) {
  const status =
    statusOverride ?? getFinalizedTransactionStatus(transaction.status, ethersReceipt?.status)

  const receipt: TransactionReceipt | undefined = ethersReceipt
    ? {
        blockHash: ethersReceipt.blockHash,
        blockNumber: ethersReceipt.blockNumber,
        transactionIndex: ethersReceipt.transactionIndex,
        confirmations: ethersReceipt.confirmations,
        confirmedTime: Date.now(),
        gasUsed: ethersReceipt.gasUsed?.toNumber(),
        effectiveGasPrice: ethersReceipt.effectiveGasPrice?.toNumber(),
      }
    : undefined

  yield* put(
    transactionActions.finalizeTransaction({
      ...transaction,
      status,
      receipt,
    })
  )

  // Flip status to true so we can render Notification badge on home
  yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
  // Refetch data when a local tx has confirmed
  yield* refetchGQLQueries(transaction)

  if (transaction.typeInfo.type === TransactionType.Swap) {
    const hasDoneASwap = yield* select(selectHasDoneASwap)
    if (!hasDoneASwap) {
      // Only log event if it's a user's first ever swap
      yield* call([appsFlyer, appsFlyer.logEvent], 'swap_completed', {})
    }
  }
}

/**
 * Delete transaction from state. Should be called when a transaction should no longer
 * be monitored. Often used when txn is replaced or cancelled.
 * @param transaction txn to delete from state
 */
export function* deleteTransaction(transaction: TransactionDetails) {
  yield* put(
    transactionActions.deleteTransaction({
      address: transaction.from,
      id: transaction.id,
      chainId: transaction.chainId,
    })
  )
}
