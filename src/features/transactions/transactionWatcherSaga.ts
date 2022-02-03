import { BigNumber, providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { TRANSACTION_TIMEOUT_DURATION } from 'src/constants/transactions'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { NotificationSeverity } from 'src/features/notifications/types'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { attemptCancelTransaction } from 'src/features/transactions/cancelTransaction'
import { attemptReplaceTransaction } from 'src/features/transactions/replaceTransaction'
import {
  addTransaction,
  cancelTransaction,
  failTransaction,
  replaceTransaction,
  transactionActions,
  updateTransaction,
} from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'src/features/transactions/types'
import { getPendingTransactions } from 'src/features/transactions/utils'
import { logger } from 'src/utils/logger'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { call, delay, fork, put, race, take } from 'typed-redux-saga'

export function* transactionWatcher() {
  // Delay execution until providers are ready
  yield* call(waitForProvidersInitialized)
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting tx watcher')

  // First, fork off watchers for any pending txs that are already in store
  // This allows us to detect completions if a user closed the app before a tx finished
  const txsByChainId = yield* appSelect((state) => state.transactions.byChainId)
  const pendingTransactions = getPendingTransactions(flattenObjectOfObjects(txsByChainId))
  for (const pendingTx of pendingTransactions) {
    yield* fork(watchTransaction, pendingTx)
  }

  // Next, start watching for new or updated transactions dispatches
  while (true) {
    const { payload: transaction } = yield* take<ReturnType<typeof addTransaction>>([
      addTransaction.type,
      updateTransaction.type,
    ])
    yield* fork(watchTransaction, transaction)
  }
}

export function* watchTransaction(transaction: TransactionDetails) {
  const { chainId, id, hash, options, from, addedTime } = transaction
  try {
    logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
    const provider = yield* call(getProvider, chainId)

    const maxTimeout = options.timeoutMs ?? TRANSACTION_TIMEOUT_DURATION
    const remainingTimeout = maxTimeout - (Date.now() - addedTime)

    // Before starting race, check to see if tx is old and already (or nearly) timed out
    if (remainingTimeout <= 5_000 /* 5s */) {
      yield* call(handleTimedOutTransaction, transaction, provider)
      return
    }

    const { receipt, cancel, replace, timeout } = yield* race({
      receipt: call(waitForReceipt, hash, provider),
      cancel: call(waitForCancellation, chainId, id),
      replace: call(waitForReplacement, chainId, id),
      timeout: delay(remainingTimeout),
    })

    if (cancel) {
      yield* call(attemptCancelTransaction, transaction)
      return
    }

    if (replace) {
      yield* call(attemptReplaceTransaction, transaction, replace.newTxParams)
      return
    }

    if (timeout || !receipt) {
      logger.debug('transactionWatcherSaga', 'watchTransaction', 'Tx timed out', hash)
      yield* call(handleTimedOutTransaction, transaction, provider)
      return
    }

    // Update the store with tx receipt details
    yield* call(finalizeTransaction, chainId, id, receipt)

    if (options.fetchBalanceOnSuccess) {
      yield* put(fetchBalancesActions.trigger(from))
    }
  } catch (error) {
    logger.error(
      'transactionWatcherSaga',
      'watchTransaction',
      'Error while watching transaction',
      hash,
      error
    )
    yield* put(
      pushNotification({
        message: 'Error while checking transaction status',
        severity: NotificationSeverity.Error,
      })
    )
  }
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
    if (payload.chainId === chainId && payload.id === id) return true
  }
}

function* waitForReplacement(chainId: ChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof replaceTransaction>>(replaceTransaction.type)
    if (payload.chainId === chainId && payload.id === id) return payload
  }
}

function* handleTimedOutTransaction(transaction: TransactionDetails, provider: providers.Provider) {
  const { hash, id, chainId, from, options } = transaction
  if (!hash) {
    // Tx was never sent properly, mark as failed
    yield* put(failTransaction({ chainId, id }))
  }
  // Check if tx was actually mined
  // Just a backup to ensure wallet doesn't incorrectly report a failed tx
  const txReceipt = yield* call([provider, provider.getTransactionReceipt], transaction.hash)
  if (txReceipt) {
    yield* call(finalizeTransaction, chainId, id, txReceipt)
  }

  // Next, check if tx is still pending. If so, cancel it
  // TODO blocked by https://github.com/Uniswap/mobile/issues/377
  // Need a way to query current mempool and look for hash
  // Using nonce values as a stopgap solution for now
  const nonce = options.request.nonce
  const txCount = yield* call([provider, provider.getTransactionCount], from, 'pending')
  if (nonce && BigNumber.from(txCount).gt(nonce)) {
    // The tx may still be pending, attempt to cancel it
    yield* call(attemptCancelTransaction, transaction)
  } else {
    // Otherwise, mark it as failed
    yield* put(failTransaction({ chainId, id }))
  }
}

function* finalizeTransaction(
  chainId: ChainId,
  id: string,
  ethersReceipt: providers.TransactionReceipt
) {
  const status = ethersReceipt.status ? TransactionStatus.Success : TransactionStatus.Failed
  const receipt: TransactionReceipt = {
    blockHash: ethersReceipt.blockHash,
    blockNumber: ethersReceipt.blockNumber,
    transactionIndex: ethersReceipt.transactionIndex,
    confirmations: ethersReceipt.confirmations,
    confirmedTime: Date.now(),
  }
  yield* put(
    transactionActions.finalizeTransaction({
      chainId,
      id,
      status,
      receipt,
    })
  )
}
