import { PayloadAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import { appSelect } from 'src/app/hooks'
import { getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { NotificationSeverity } from 'src/features/notifications/types'
import { waitForProvidersInitialized } from 'src/features/providers/providerSaga'
import { addTransaction, transactionActions } from 'src/features/transactions/slice'
import {
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'src/features/transactions/types'
import { getPendingTransactions } from 'src/features/transactions/utils'
import { logger } from 'src/utils/logger'
import { flattenObjectOfObjects } from 'src/utils/objects'
import { call, fork, put, take } from 'typed-redux-saga'

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

  // Next, start watching for new transactions to be added
  while (true) {
    const { payload: transaction } = yield* take<PayloadAction<TransactionDetails>>(
      addTransaction.type
    )
    yield* fork(watchTransaction, transaction)
  }
}

function* watchTransaction({ chainId, hash, options, from }: TransactionDetails) {
  try {
    logger.debug('transactionWatcherSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
    const provider = yield* call(getProvider, chainId)
    // Wait for the first confirmation/failure receipt for the tx
    // TODO wrap this in race to support cancellation / replacement
    // https://github.com/Uniswap/mobile/issues/357
    const txReceipt = yield* call([provider, provider.waitForTransaction], hash)
    logger.debug('transactionWatcherSaga', 'watchTransaction', 'Tx receipt received for:', hash)

    // Update the store with tx receipt details
    yield* call(finalizeTransaction, chainId, txReceipt)

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
    yield put(
      pushNotification({
        message: 'Error while checking transaction status',
        severity: NotificationSeverity.error,
      })
    )
  }
}

function* finalizeTransaction(chainId: ChainId, ethersReceipt: providers.TransactionReceipt) {
  const hash = ethersReceipt.transactionHash
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
      hash,
      status,
      receipt,
    })
  )
}
