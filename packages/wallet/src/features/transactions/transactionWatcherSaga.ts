/* eslint-disable max-lines */
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { SwapEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumberish, providers } from 'ethers'
import { call, delay, fork, put, race, select, take, takeEvery } from 'typed-redux-saga'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { FiatOnRampTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { findGasStrategyName } from 'uniswap/src/features/gas/hooks'
import { getGasPrice } from 'uniswap/src/features/gas/types'
import { MobileAppsFlyerEvents, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { selectIncompleteTransactions, selectSwapTransactionsCount } from 'uniswap/src/features/transactions/selectors'
import {
  addTransaction,
  cancelTransaction,
  forceFetchFiatOnRampTransactions,
  replaceTransaction,
  transactionActions,
  updateTransaction,
  upsertFiatOnRampTransaction,
} from 'uniswap/src/features/transactions/slice'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  BaseSwapTransactionInfo,
  FinalizedTransactionDetails,
  QueuedOrderStatus,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  isFinalizedTx,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n/i18n'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { fetchFiatOnRampTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { pushNotification, setNotificationStatus } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { OrderWatcher } from 'wallet/src/features/transactions/orderWatcherSaga'
import { refetchGQLQueries } from 'wallet/src/features/transactions/refetchGQLQueriesSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import {
  getDiff,
  getFinalizedTransactionStatus,
  getPercentageError,
  isOnRampTransaction,
  receiptFromEthersReceipt,
} from 'wallet/src/features/transactions/utils'
import { getProvider } from 'wallet/src/features/wallet/context'

export function* transactionWatcher({ apolloClient }: { apolloClient: ApolloClient<NormalizedCacheObject> }) {
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting tx watcher')

  // Start the order watcher to allow off-chain order updates to propagate to watchTransaction
  yield* fork(OrderWatcher.initialize)

  // First, fork off watchers for any incomplete txs that are already in store
  // This allows us to detect completions if a user closed the app before a tx finished
  const incompleteTransactions = yield* select(selectIncompleteTransactions)
  for (const transaction of incompleteTransactions) {
    if (isOnRampTransaction(transaction)) {
      yield* fork(watchFiatOnRampTransaction, transaction as FiatOnRampTransactionDetails)
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
    const { payload: transaction } = yield* take<ReturnType<typeof addTransaction>>([
      addTransaction.type,
      updateTransaction.type,
    ])
    try {
      if (isOnRampTransaction(transaction)) {
        yield* fork(watchFiatOnRampTransaction, transaction as FiatOnRampTransactionDetails)
      } else {
        yield* fork(watchTransaction, { transaction, apolloClient })
      }
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'transactionWatcherSaga',
          function: 'watchTransaction',
        },
        extra: { txHash: transaction.hash },
      })

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

export function* fetchUpdatedFiatOnRampTransaction(transaction: FiatOnRampTransactionDetails, forceFetch: boolean) {
  return yield* call(fetchFiatOnRampTransaction, transaction, forceFetch)
}

export function* watchFiatOnRampTransaction(transaction: FiatOnRampTransactionDetails) {
  const { id } = transaction
  let forceFetch = false

  logger.debug('transactionWatcherSaga', 'watchFiatOnRampTransaction', 'Watching for updates for fiat onramp tx:', id)

  try {
    while (true) {
      const updatedTransaction = yield* fetchUpdatedFiatOnRampTransaction(transaction, forceFetch)

      forceFetch = false
      // We've got an invalid response from backend
      if (!updatedTransaction) {
        return
      }

      // Stale transaction, never found on backend
      if (updatedTransaction.status === TransactionStatus.Unknown) {
        yield* call(deleteTransaction, transaction)
        return // stop polling
      }

      // Transaction has been found
      if (updatedTransaction.typeInfo.type !== TransactionType.LocalOnRamp) {
        logger.debug(
          'transactionWatcherSaga',
          'watchFiatOnRampTransaction',
          `Updating transaction with id ${id} from status ${transaction.status} to ${updatedTransaction.status}`,
        )
      }

      // Update transaction
      yield* put(upsertFiatOnRampTransaction(updatedTransaction))

      // Finished transaction
      if (
        updatedTransaction.status === TransactionStatus.Failed ||
        updatedTransaction.status === TransactionStatus.Success
      ) {
        // Show notification badge
        yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
        return // stop polling
      }

      // at this point, we received a response from backend
      // however, we didn't have enough information to act
      // try again after a waiting period or when we've come back WebView
      const raceResult = yield* race({
        forceFetch: take(forceFetchFiatOnRampTransactions),
        timeout: delay(PollingInterval.Fast),
      })

      if (raceResult.forceFetch) {
        forceFetch = true
      }
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'transactionWatcherSaga', function: 'watchFiatOnRampTransaction' },
    })
  }
}

export function* watchTransaction({
  transaction,
  apolloClient,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
}): Generator<unknown> {
  const { chainId, id, hash } = transaction

  logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
  const provider = yield* call(getProvider, chainId)

  const nonce = isUniswapX(transaction) ? undefined : transaction.options.request.nonce
  const { updatedTransaction, cancel, replace, invalidated } = yield* race({
    updatedTransaction: call(waitForRemoteUpdate, transaction, provider),
    cancel: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
    invalidated: call(waitForTxnInvalidated, chainId, id, nonce),
  })

  // `cancel` and `updatedTransaction` conditions apply to both Classic and UniswapX transactions
  if (cancel) {
    // reset watcher for the current txn, as it can still be mined (or invalidated by the new txn)
    yield* fork(watchTransaction, { transaction, apolloClient })
    // Cancel the current txn, which submits a new txn on chain and monitored in state
    yield* call(attemptCancelTransaction, transaction, cancel)
    return
  }

  if (updatedTransaction) {
    if (isFinalizedTx(updatedTransaction)) {
      // Update the store with tx receipt details
      yield* call(finalizeTransaction, { transaction: updatedTransaction, apolloClient })
      return
    } else {
      yield* put(transactionActions.updateTransaction(updatedTransaction))
      // reset watcher for the current txn, as new statuses can be received for the pending order
      yield* fork(watchTransaction, { transaction: updatedTransaction, apolloClient })
    }
  }

  // `replace` and `invalidated` conditions do not apply to UniswapX orders
  if (isUniswapX(transaction)) {
    return
  }

  if (replace) {
    // Same logic as cancelation, but skip directly to replacement
    yield* fork(watchTransaction, { transaction, apolloClient })
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
          errorMessage: i18n.t('transaction.watcher.error.cancel'),
        }),
      )
    }
    return
  }
}

export async function waitForReceipt(
  hash: string,
  provider: providers.Provider,
): Promise<providers.TransactionReceipt> {
  const txReceipt = await provider.waitForTransaction(hash)
  if (txReceipt) {
    logger.debug('transactionWatcherSaga', 'waitForTransactionReceipt', 'Tx receipt received', hash)
  }
  return txReceipt
}

function* waitForRemoteUpdate(transaction: TransactionDetails, provider: providers.Provider) {
  let hash = transaction.hash
  let status = transaction.status

  // For UniswapX orders, we need to wait for the order to be filled before we can get the hash
  if (isUniswapX(transaction) && transaction.orderHash && transaction.queueStatus) {
    const updatedOrder = yield* call(OrderWatcher.waitForOrderStatus, transaction.orderHash, transaction.queueStatus)
    hash = updatedOrder.hash
    status = updatedOrder.status

    // Return early if a new status is received, but no hash is provided (meaning the order is not filled)
    if (!updatedOrder.hash) {
      return updatedOrder
    }
  }

  // At this point, the tx should either be a classic tx or a filled order, both of which have hashes
  if (!hash) {
    logger.error(new Error('Watching for tx with no hash'), {
      tags: {
        file: 'transactionWatcherSaga',
        function: 'watchTransaction',
      },
      extra: { transaction },
    })
    return
  }

  const ethersReceipt = yield* call(waitForReceipt, hash, provider)
  const receipt = receiptFromEthersReceipt(ethersReceipt)

  // Classic transaction status is based on receipt, while UniswapX status is based backend response.
  if (isClassic(transaction)) {
    status = getFinalizedTransactionStatus(transaction.status, ethersReceipt?.status)
  }
  return { ...transaction, status, receipt, hash }
}

function* waitForCancellation(chainId: WalletChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof cancelTransaction>>(cancelTransaction.type)
    if (payload.cancelRequest && payload.chainId === chainId && payload.id === id) {
      return payload.cancelRequest
    }
  }
}

function* waitForReplacement(chainId: WalletChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof replaceTransaction>>(replaceTransaction.type)
    if (payload.chainId === chainId && payload.id === id) {
      return payload
    }
  }
}
/**
 * Monitor for transactions with the same nonce as the current transaction. If any duplicate is finalized, it means
 * the current transaction has been invalidated and wont be picked up on chain.
 */
export function* waitForTxnInvalidated(chainId: WalletChainId, id: string, nonce: BigNumberish | undefined) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof transactionActions.finalizeTransaction>>(
      transactionActions.finalizeTransaction.type,
    )

    if (
      !isUniswapX(payload) && // UniswapX transactions are submitted by a filler, so they cannot invalidate a transaction sent by a user.
      payload.chainId === chainId &&
      payload.id !== id &&
      payload.options.request.nonce === nonce
    ) {
      return true
    }
  }
}

/**
 * Send analytics events for finalized transactions
 */
export function logTransactionEvent(actionData: ReturnType<typeof transactionActions.finalizeTransaction>): void {
  const { payload } = actionData
  const { hash, chainId, addedTime, from, typeInfo, receipt, status, transactionOriginType } = payload
  const { gasUsed, effectiveGasPrice, confirmedTime } = receipt ?? {}
  const { type } = typeInfo

  // Send analytics event for swap success and failure
  if (type === TransactionType.Swap) {
    const {
      slippageTolerance,
      quoteId,
      routeString,
      gasUseEstimate,
      inputCurrencyId,
      outputCurrencyId,
      tradeType,
      protocol,
      transactedUSDValue,
    } = typeInfo as BaseSwapTransactionInfo

    const baseProperties = {
      hash,
      transactionOriginType,
      address: from,
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
      submitViaPrivateRpc: isUniswapX(payload) ? false : payload.options.submitViaPrivateRpc,
      protocol,
      transactedUSDValue,
    }

    if (isUniswapX(payload)) {
      const { orderHash, routing } = payload
      // All local uniswapx swaps should be tracked in redux with an orderHash .
      if (!orderHash) {
        logger.error(new Error('Attempting to log uniswapx swap event without a orderHash'), {
          tags: {
            file: 'transactionWatcherSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }
      if (status === TransactionStatus.Success) {
        const properties = { ...baseProperties, routing, order_hash: orderHash, hash }
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, properties)
      } else {
        const properties = { ...baseProperties, routing, order_hash: orderHash }
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_FAILED, properties)
      }
    } else {
      const { routing } = payload
      // All classic swaps should be tracked in redux with a tx hash.
      if (!hash) {
        logger.error(new Error('Attempting to log swap event without a hash'), {
          tags: {
            file: 'transactionWatcherSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }
      const properties = { ...baseProperties, routing, hash }
      if (status === TransactionStatus.Success) {
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, properties)
      } else {
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_FAILED, properties)
      }
    }
  }

  // Log metrics for confirmed transfers
  if (type === TransactionType.Send) {
    const { tokenAddress, recipient: toAddress, currencyAmountUSD } = typeInfo as SendTokenTransactionInfo

    const amountUSD = currencyAmountUSD ? parseFloat(currencyAmountUSD?.toFixed(2)) : undefined

    sendAnalyticsEvent(WalletEventName.TransferCompleted, {
      chainId,
      tokenAddress,
      toAddress,
      amountUSD,
    })
  }

  maybeLogGasEstimateAccuracy(payload)
}

function maybeLogGasEstimateAccuracy(transaction: FinalizedTransactionDetails) {
  const { gasEstimates } = transaction.typeInfo
  if (!gasEstimates) {
    return
  }
  for (const estimate of [gasEstimates.activeEstimate, ...(gasEstimates.shadowEstimates || [])]) {
    const gasUseDiff = getDiff(estimate.gasLimit, transaction.receipt?.gasUsed)
    const gasPriceDiff = getDiff(getGasPrice(estimate), transaction.receipt?.effectiveGasPrice)

    sendAnalyticsEvent(WalletEventName.GasEstimateAccuracy, {
      tx_hash: transaction.hash,
      transaction_type: transaction.typeInfo.type,
      chain_id: transaction.chainId,
      final_status: transaction.status,
      time_to_confirmed_ms: getDiff(transaction.receipt?.confirmedTime, transaction.addedTime),
      blocks_to_confirmed: getDiff(transaction.receipt?.blockNumber, gasEstimates.blockSubmitted),
      gas_use_diff: gasUseDiff,
      gas_use_diff_percentage: getPercentageError(gasUseDiff, estimate.gasLimit),
      gas_used: transaction.receipt?.gasUsed,
      gas_price_diff: gasPriceDiff,
      gas_price_diff_percentage: getPercentageError(gasPriceDiff, getGasPrice(estimate)),
      gas_price: transaction.receipt?.effectiveGasPrice,
      max_priority_fee_per_gas: 'maxPriorityFeePerGas' in estimate ? estimate.maxPriorityFeePerGas : undefined,
      private_rpc: isClassic(transaction) ? transaction.options.submitViaPrivateRpc : false,
      is_shadow: estimate !== gasEstimates.activeEstimate,
      name: findGasStrategyName(estimate),
    })
  }
}

export function* finalizeTransaction({
  apolloClient,
  transaction,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  transaction: FinalizedTransactionDetails
}) {
  yield* put(transactionActions.finalizeTransaction(transaction))

  // Flip status to true so we can render Notification badge on home
  yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
  // Refetch data when a local tx has confirmed
  yield* refetchGQLQueries({ transaction, apolloClient })

  if (transaction.typeInfo.type === TransactionType.Swap) {
    const hasDoneOneSwap = (yield* select(selectSwapTransactionsCount)) === 1
    if (hasDoneOneSwap) {
      // Only log event if it's a user's first ever swap
      // TODO: Add $ amount to swap event once transaction type supports it
      yield* call(sendAppsFlyerEvent, MobileAppsFlyerEvents.SwapCompleted)
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
    }),
  )
}

export function* watchTransactionEvents() {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
