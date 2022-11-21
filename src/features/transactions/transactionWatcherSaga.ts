import { providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { PollingInterval } from 'src/constants/misc'
import { fetchFiatOnRampTransaction } from 'src/features/fiatOnRamp/api'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { fetchTransactionStatus } from 'src/features/providers/flashbotsProvider'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransaction'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import { selectIncompleteTransactions } from 'src/features/transactions/selectors'
import {
  addTransaction,
  cancelTransaction,
  replaceTransaction,
  transactionActions,
  updateTransaction,
  upsertFiatOnRampTransaction,
} from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'src/utils/time'
import { sleep } from 'src/utils/timing'
import { call, fork, put, race, take } from 'typed-redux-saga'

const FLASHBOTS_POLLING_INTERVAL = ONE_SECOND_MS * 5

export function* transactionWatcher() {
  // Delay execution until providers are ready
  yield* call(waitForProvidersInitialized)
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
      } else if (transaction.isFlashbots) {
        yield* fork(watchFlashbotsTransaction, transaction)
      } else {
        yield* fork(watchTransaction, transaction)
      }
    } catch (error) {
      const { hash } = transaction
      logger.error(
        'transactionWatcherSaga',
        'watchTransaction',
        'Error while watching transaction',
        hash,
        error
      )
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

export function* getFlashbotsTxConfirmation(txHash: string, chainId: ChainId) {
  while (true) {
    const status = yield* call(fetchTransactionStatus, txHash, chainId)
    if (status !== TransactionStatus.Pending) {
      return status
    }

    yield* call(sleep, FLASHBOTS_POLLING_INTERVAL)
  }
}

export function* watchFlashbotsTransaction(transaction: TransactionDetails) {
  const { chainId, hash, from } = transaction

  const txStatus = yield* call(getFlashbotsTxConfirmation, hash, chainId)
  if (txStatus === TransactionStatus.Failed || txStatus === TransactionStatus.Unknown) {
    yield* call(finalizeTransaction, transaction, null, TransactionStatus.Failed)
    yield* put(
      pushNotification({
        type: AppNotificationType.Error,
        address: from,
        errorMessage: i18n.t('Your transaction has failed.'),
      })
    )
    return
  }

  const provider = yield* call(getProvider, chainId)
  const receipt = yield* call(waitForReceipt, hash, provider)
  yield* call(finalizeTransaction, transaction, receipt, txStatus)
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

      // not strictly necessary but avoid dispatching an action if tx status hasn't changed
      if (updatedTransaction.status !== transaction.status) {
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
        // can stop polling once transaction is final
        break
      }

      // at this point, we received a response from Moonpay's API
      // however, we didn't have enough information to act
      // try again after a waiting period
      yield* call(sleep, PollingInterval.Normal)
    }
  } catch (e) {
    logger.error(
      'transactionWatcherSaga',
      'watchFiatOnRampTranasction',
      'Failed to fetch details',
      e
    )
  }
}

export function* watchTransaction(transaction: TransactionDetails) {
  const { chainId, id, hash } = transaction

  logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
  const provider = yield* call(getProvider, chainId)

  const { receipt, cancel, replace } = yield* race({
    receipt: call(waitForReceipt, hash, provider),
    cancel: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
  })

  if (cancel) {
    yield* call(attemptCancelTransaction, transaction)
    return
  }

  if (replace) {
    yield* call(attemptReplaceTransaction, transaction, replace.newTxParams)
    return
  }

  // Update the store with tx receipt details
  yield* call(finalizeTransaction, transaction, receipt)
}

export async function waitForReceipt(hash: string, provider: providers.Provider) {
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

function* finalizeTransaction(
  transaction: TransactionDetails,
  ethersReceipt?: providers.TransactionReceipt | null,
  statusOverride?:
    | TransactionStatus.Success
    | TransactionStatus.Failed
    | TransactionStatus.Cancelled
) {
  const status =
    statusOverride ??
    (ethersReceipt?.status
      ? transaction.status === TransactionStatus.Cancelling
        ? TransactionStatus.Cancelled
        : TransactionStatus.Success
      : TransactionStatus.Failed)
  const receipt: TransactionReceipt | undefined = ethersReceipt
    ? {
        blockHash: ethersReceipt.blockHash,
        blockNumber: ethersReceipt.blockNumber,
        transactionIndex: ethersReceipt.transactionIndex,
        confirmations: ethersReceipt.confirmations,
        confirmedTime: Date.now(),
      }
    : undefined

  yield* put(
    transactionActions.finalizeTransaction({
      ...transaction,
      status,
      receipt,
    })
  )
}
