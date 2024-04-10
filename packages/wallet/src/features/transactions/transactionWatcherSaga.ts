import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { SwapEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumberish, providers } from 'ethers'
import { Statsig } from 'statsig-react-native'
import { call, delay, fork, put, race, select, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import {
  fetchFiatOnRampTransaction,
  fetchMoonpayTransaction,
} from 'wallet/src/features/fiatOnRamp/api'
import { FiatOnRampTransactionDetails } from 'wallet/src/features/fiatOnRamp/types'
import { pushNotification, setNotificationStatus } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { refetchGQLQueries } from 'wallet/src/features/transactions/refetchGQLQueriesSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import {
  selectIncompleteTransactions,
  selectSwapTransactionsCount,
} from 'wallet/src/features/transactions/selectors'
import {
  addTransaction,
  cancelTransaction,
  forceFetchFiatOnRampTransactions,
  replaceTransaction,
  transactionActions,
  updateTransaction,
  upsertFiatOnRampTransaction,
} from 'wallet/src/features/transactions/slice'
import {
  BaseSwapTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getFinalizedTransactionStatus } from 'wallet/src/features/transactions/utils'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import i18n from 'wallet/src/i18n/i18n'
import { appSelect } from 'wallet/src/state'
import { sendWalletAnalyticsEvent, sendWalletAppsFlyerEvent } from 'wallet/src/telemetry'
import {
  FiatOnRampEventName,
  InstitutionTransferEventName,
  WalletAppsFlyerEvents,
  WalletEventName,
} from 'wallet/src/telemetry/constants'

export function* transactionWatcher({
  apolloClient,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
}) {
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting tx watcher')

  // First, fork off watchers for any incomplete txs that are already in store
  // This allows us to detect completions if a user closed the app before a tx finished
  const incompleteTransactions = yield* appSelect(selectIncompleteTransactions)
  for (const transaction of incompleteTransactions) {
    if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
      yield* fork(watchFiatOnRampTransaction, transaction as FiatOnRampTransactionDetails)
    } else {
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
      if (transaction.typeInfo.type === TransactionType.FiatPurchase) {
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
        })
      )
    }
  }
}

export function* fetchUpdatedFiatOnRampTransaction(transaction: FiatOnRampTransactionDetails) {
  const activeAccount = yield* select(selectActiveAccount)
  if (!activeAccount) {
    return
  }
  const signerManager = yield* call(getSignerManager)
  return yield* call(
    fetchFiatOnRampTransaction,
    /** previousTransactionDetails= */ transaction,
    activeAccount,
    signerManager
  )
}

export function* fetchUpdatedMoonpayTransaction(transaction: FiatOnRampTransactionDetails) {
  return yield* call(fetchMoonpayTransaction, /** previousTransactionDetails= */ transaction)
}

export function* watchFiatOnRampTransaction(transaction: FiatOnRampTransactionDetails) {
  // we want to re-fetch this every time we've added a transaction,
  // as this feature flag could be changed after the app has started
  const useOldMoonpayIntegration = !Statsig.checkGate(FEATURE_FLAGS.ForAggregator)

  const { id } = transaction

  logger.debug(
    'transactionWatcherSaga',
    'watchFiatOnRampTransaction',
    'Watching for updates for fiat onramp tx:',
    id,
    'useOldMoonpayIntegration:',
    useOldMoonpayIntegration
  )

  try {
    while (true) {
      const updatedTransaction = yield* useOldMoonpayIntegration
        ? fetchUpdatedMoonpayTransaction(transaction)
        : fetchUpdatedFiatOnRampTransaction(transaction)

      // We've got an invalid response from backend
      if (!updatedTransaction) {
        return
      }
      // Transaction has been updated
      if (JSON.stringify(updatedTransaction) !== JSON.stringify(transaction)) {
        logger.debug(
          'transactionWatcherSaga',
          'watchFiatOnRampTransaction',
          `Updating transaction with id ${id} from status ${transaction.status} to ${updatedTransaction.status}`
        )
        const isTransfer =
          updatedTransaction.typeInfo.inputSymbol === updatedTransaction.typeInfo.outputSymbol
        if (isTransfer && transaction.typeInfo.institution) {
          yield* call(
            sendWalletAnalyticsEvent,
            InstitutionTransferEventName.InstitutionTransferTransactionUpdated,
            {
              externalTransactionId: transaction.id,
              status: transaction.status,
              institutionName: transaction.typeInfo.institution,
            }
          )
        } else if (transaction.typeInfo.serviceProvider) {
          yield* call(sendWalletAnalyticsEvent, FiatOnRampEventName.FiatOnRampTransactionUpdated, {
            externalTransactionId: transaction.id,
            status: transaction.status,
            serviceProvider: transaction.typeInfo.serviceProvider,
          })
        }

        // Stale transaction
        if (updatedTransaction.status === TransactionStatus.Unknown) {
          yield* call(deleteTransaction, updatedTransaction)
          break // stop polling
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
          break // stop polling
        }
      }

      // at this point, we received a response from backend
      // however, we didn't have enough information to act
      // try again after a waiting period or when we've come back WebView
      yield* race({
        forceFetch: take(forceFetchFiatOnRampTransactions),
        timeout: delay(
          useOldMoonpayIntegration ? PollingInterval.Normal : PollingInterval.KindaFast
        ),
      })
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
  const { chainId, id, hash, options } = transaction

  logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
  const provider = yield* call(getProvider, chainId)

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

  const { receipt, cancel, replace, invalidated } = yield* race({
    receipt: call(waitForReceipt, hash, provider),
    cancel: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
    invalidated: call(waitForTxnInvalidated, chainId, id, options.request.nonce),
  })

  if (cancel) {
    // reset watcher for the current txn, as it can still be mined (or invalidated by the new txn)
    yield* fork(watchTransaction, { transaction, apolloClient })
    // Cancel the current txn, which submits a new txn on chain and monitored in state
    yield* call(attemptCancelTransaction, transaction)
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
        })
      )
    }
    return
  }

  // Update the store with tx receipt details
  yield* call(finalizeTransaction, { transaction, ethersReceipt: receipt, apolloClient })
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
    if (payload.cancelRequest && payload.chainId === chainId && payload.id === id) {
      return true
    }
  }
}

function* waitForReplacement(chainId: ChainId, id: string) {
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
export function* waitForTxnInvalidated(
  chainId: ChainId,
  id: string,
  nonce: BigNumberish | undefined
) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof transactionActions.finalizeTransaction>>(
      transactionActions.finalizeTransaction.type
    )
    if (
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
export function logTransactionEvent(
  actionData: ReturnType<typeof transactionActions.finalizeTransaction>
): void {
  const { payload } = actionData
  const {
    hash,
    chainId,
    addedTime,
    from,
    typeInfo,
    receipt,
    status,
    options: { submitViaPrivateRpc },
  } = payload
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
      quoteType,
    } = typeInfo as BaseSwapTransactionInfo
    const eventName =
      status === TransactionStatus.Success
        ? SwapEventName.SWAP_TRANSACTION_COMPLETED
        : SwapEventName.SWAP_TRANSACTION_FAILED
    sendWalletAnalyticsEvent(eventName, {
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
      submitViaPrivateRpc,
      protocol,
      transactedUSDValue,
      quoteType,
    })
  }

  // Log metrics for confirmed transfers
  if (type === TransactionType.Send) {
    const { tokenAddress, recipient: toAddress } = typeInfo as SendTokenTransactionInfo
    sendWalletAnalyticsEvent(WalletEventName.TransferCompleted, {
      chainId,
      tokenAddress,
      toAddress,
    })
  }
}

type StatusOverride =
  | TransactionStatus.Success
  | TransactionStatus.Failed
  | TransactionStatus.Canceled

function* finalizeTransaction({
  apolloClient,
  ethersReceipt,
  statusOverride,
  transaction,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  ethersReceipt?: providers.TransactionReceipt | null
  statusOverride?: StatusOverride
  transaction: TransactionDetails
}) {
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

  const hash = transaction.hash

  if (!hash) {
    logger.error(new Error('Attempting to finalize tx without a hash'), {
      tags: {
        file: 'transactionWatcherSaga',
        function: 'finalizeTransaction',
      },
      extra: { transaction },
    })
    return
  }

  yield* put(
    transactionActions.finalizeTransaction({
      ...transaction,
      hash,
      status,
      receipt,
    })
  )

  // Flip status to true so we can render Notification badge on home
  yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
  // Refetch data when a local tx has confirmed
  yield* refetchGQLQueries({ transaction, apolloClient })

  if (transaction.typeInfo.type === TransactionType.Swap) {
    const hasDoneOneSwap = (yield* appSelect(selectSwapTransactionsCount)) === 1
    if (hasDoneOneSwap) {
      // Only log event if it's a user's first ever swap
      // TODO: Add $ amount to swap event once transaction type supports it
      yield* call(sendWalletAppsFlyerEvent, WalletAppsFlyerEvents.SwapCompleted)
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
