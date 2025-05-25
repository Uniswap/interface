import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { BigNumber, BigNumberish, providers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { call, cancel, delay, fork, put, race, take } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { waitForFlashbotsProtectReceipt } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { cancelTransaction, replaceTransaction, transactionActions } from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  BridgeTransactionDetails,
  FinalizedTransactionDetails,
  OnChainTransactionDetails,
  TEMPORARY_TRANSACTION_STATUSES,
  TransactionDetails,
  TransactionStatus,
  isFinalizedTx,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import { getFinalizedTransactionStatus, receiptFromEthersReceipt } from 'wallet/src/features/transactions/utils'
import { OrderWatcher } from 'wallet/src/features/transactions/watcher/orderWatcherSaga'
import {
  finalizeTransaction,
  logTransactionTimeout,
} from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { deleteTransaction } from 'wallet/src/features/transactions/watcher/transactionSagaUtils'
import { waitForBridgingStatus } from 'wallet/src/features/transactions/watcher/watchBridgeSaga'
import { watchForAppBackgrounded } from 'wallet/src/features/transactions/watcher/watchForAppBackgroundedSaga'
import { getProvider } from 'wallet/src/features/wallet/context'

export async function waitForReceipt(
  hash: string,
  provider: providers.Provider,
): Promise<providers.TransactionReceipt> {
  const txReceipt = await provider.waitForTransaction(hash)
  if (txReceipt) {
    logger.debug('watchOnChainTransactionSaga', 'waitForReceipt', 'Tx receipt received', hash)
  }
  return txReceipt
}

/**
 * Flashbots transactions won't return a receipt until they're included, and will fail silently.
 * We need to use Flashbots Protect API to get a status update until the tx is included or fails.
 * @see {@link https://protect.flashbots.net/tx/docs}
 */
function* getFlashbotsTransactionStatus(transaction: TransactionDetails, hash: string) {
  try {
    const flashbotsReceipt = yield* call(waitForFlashbotsProtectReceipt, hash)

    switch (flashbotsReceipt.status) {
      case 'FAILED':
        logger.warn(
          'watchOnChainTransactionSaga',
          'getFlashbotsTransactionStatus',
          `Flashbots Protect transaction failed with simulation error: ${flashbotsReceipt.simError}`,
          { transaction, flashbotsReceipt },
        )
        return TransactionStatus.Failed
      case 'CANCELLED':
        return TransactionStatus.Canceled
      case 'INCLUDED':
        return TransactionStatus.Success
      case 'UNKNOWN': // Transaction not found by Flashbots Protect, might have been submitted through another provider
      default:
        return undefined
    }
  } catch (error) {
    logger.error('Error fetching Flashbots Protect transaction status', {
      tags: {
        file: 'watchOnChainTransactionSaga',
        function: 'getFlashbotsTransactionStatus',
      },
      extra: { transaction, error },
    })
    return undefined
  }
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

  if ((isBridge(transaction) || isClassic(transaction)) && !transaction.options?.rpcSubmissionTimestampMs) {
    // Transaction was not submitted yet, ignore it for now
    // Once it's submitted, it'll be updated and the watcher will pick it up
    return undefined
  }

  // At this point, the tx should either be a classic / bridge tx or a filled order, both of which have hashes
  if (!hash) {
    logger.error(new Error('Watching for tx with no hash'), {
      tags: {
        file: 'watchOnChainTransactionSaga',
        function: 'waitForRemoteUpdate',
      },
      extra: { transaction },
    })
    return undefined
  }

  if (isClassic(transaction) && transaction.options?.submitViaPrivateRpc) {
    const flashbotsStatus = yield* call(getFlashbotsTransactionStatus, transaction, hash)
    if (flashbotsStatus === TransactionStatus.Failed || flashbotsStatus === TransactionStatus.Canceled) {
      // Status is final and we won't get a receipt from ethers. Return early and finalize the transaction
      return { ...transaction, status: flashbotsStatus }
    }
  }

  const ethersReceipt = yield* call(waitForReceipt, hash, provider)
  const receipt = receiptFromEthersReceipt(ethersReceipt)
  const nativeCurrency = NativeCurrency.onChain(transaction.chainId)

  const networkFee = {
    quantity: formatEther(ethersReceipt.effectiveGasPrice.mul(ethersReceipt.gasUsed)),
    tokenSymbol: nativeCurrency.symbol,
    tokenAddress: nativeCurrency.address,
    chainId: transaction.chainId,
  }

  if (
    isBridge(transaction) &&
    getFinalizedTransactionStatus(transaction.status, ethersReceipt?.status) === TransactionStatus.Success
  ) {
    // Only the send part was successful, wait for receive part to be confirmed on chain.
    // Bridge swaps become non-cancellable after the send transaction is confirmed on chain.
    if (!transaction.sendConfirmed) {
      const updatedTransaction: BridgeTransactionDetails = {
        ...transaction,
        sendConfirmed: true,
        networkFee,
      }
      yield* put(transactionActions.updateTransaction(updatedTransaction))
      // Updating the transaction will trigger a new watch.
      // Return undefined to break out of the current watcher.
      return undefined
    }

    // Send part was successful, poll for bridging status from BE
    status = yield* call(waitForBridgingStatus, transaction)
  }

  // Classic transaction status is based on receipt, while UniswapX status is based backend response.
  if (isClassic(transaction)) {
    status = getFinalizedTransactionStatus(transaction.status, ethersReceipt?.status)
  }

  return { ...transaction, status, receipt, hash, networkFee }
}

/**
 * Checks if a transaction that timed out waiting for receipt is potentially invalidated.
 * A transaction is considered invalidated if:
 * - The provider doesn't know about the transaction (it's not confirmed nor in the mempool)
 * - The next nonce of the account is higher than the nonce of the transaction (the transaction nonce is not valid anymore)
 * @returns true if the transaction is considered invalidated, false otherwise.
 */
export function* checkIfTransactionInvalidated(
  transaction: OnChainTransactionDetails,
  provider: providers.Provider,
): Generator<unknown, boolean> {
  if (transaction.options.request.nonce === undefined || !transaction.hash) {
    // We can't check if the transaction is invalidated
    return false
  }

  const tx = yield* call([provider, provider.getTransaction], transaction.hash)
  if (tx) {
    // Transaction is known to the provider, so it's still valid
    return false
  }

  if (!tx && !transaction.options.submitViaPrivateRpc) {
    // If submitted via public RPC and not found, we can consider it lost/invalidated
    return true
  }

  const requestNonce = BigNumber.from(transaction.options.request.nonce).toNumber()
  const nextNonce = yield* call([provider, provider.getTransactionCount], transaction.from)
  if (nextNonce > requestNonce) {
    // Transaction nonce is not valid anymore, it can't be included in a future block
    return true
  }

  // Transaction could still be around and included in a future block, so we don't consider it invalidated
  return false
}

function* handleTimeout(
  transaction: TransactionDetails,
  apolloClient: ApolloClient<NormalizedCacheObject>,
  provider: providers.Provider,
) {
  if (
    isUniswapX(transaction) ||
    !transaction.options?.timeoutTimestampMs ||
    !TEMPORARY_TRANSACTION_STATUSES.includes(transaction.status)
  ) {
    return
  }

  const delayToTimeout = transaction.options.timeoutTimestampMs - Date.now()
  if (delayToTimeout > 0) {
    yield* delay(delayToTimeout)
  }

  if (!transaction.options.timeoutLogged) {
    yield* call(logTransactionTimeout, transaction)
    // Mark as logged so we don't log it again
    yield* put(
      transactionActions.updateTransactionWithoutWatch({
        ...transaction,
        options: { ...transaction.options, timeoutLogged: true },
      }),
    )
  }

  const isInvalidated = yield* call(checkIfTransactionInvalidated, transaction, provider)
  if (isInvalidated) {
    const failedTransaction = { ...transaction, status: TransactionStatus.Failed } as FinalizedTransactionDetails
    yield* call(finalizeTransaction, {
      transaction: failedTransaction,
      apolloClient,
    })
  }
}

function* waitForCancellation(chainId: UniverseChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof cancelTransaction>>(cancelTransaction.type)
    if (payload.cancelRequest && payload.chainId === chainId && payload.id === id) {
      return payload.cancelRequest
    }
  }
}

function* waitForReplacement(chainId: UniverseChainId, id: string) {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof replaceTransaction>>(replaceTransaction.type)
    if (payload.chainId === chainId && payload.id === id) {
      return payload
    }
  }
}

export function* waitForSameNonceFinalized(
  chainId: UniverseChainId,
  id: string,
  nonce: BigNumberish | undefined,
): Generator<unknown, boolean> {
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
 * When we're canceling a bridge tx, we should invalidate the cancel tx as soon as the send part
 * of the bridge is confirmed on chain, instead of waiting for the full completion of the bridge.
 */
export function* waitForBridgeSendCompleted(
  chainId: UniverseChainId,
  id: string,
  nonce: BigNumberish | undefined,
): Generator<unknown, boolean> {
  while (true) {
    const { payload } = yield* take<ReturnType<typeof transactionActions.updateTransaction>>(
      transactionActions.updateTransaction.type,
    )

    if (
      isBridge(payload) &&
      payload.sendConfirmed &&
      payload.chainId === chainId &&
      payload.id !== id &&
      payload.options.request.nonce === nonce
    ) {
      return true
    }
  }
}

/**
 * Monitor for transactions with the same nonce as the current transaction. If any duplicate is finalized, it means
 * the current transaction has been invalidated and wont be picked up on chain.
 */
export function* waitForTxnInvalidated(
  chainId: UniverseChainId,
  id: string,
  nonce: BigNumberish | undefined,
): Generator<unknown, boolean> {
  yield* race({
    sameNonceFinalized: call(waitForSameNonceFinalized, chainId, id, nonce),
    bridgeSendCompleted: call(waitForBridgeSendCompleted, chainId, id, nonce),
  })

  return true
}

export function* watchTransaction({
  transaction,
  apolloClient,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
}): Generator<unknown> {
  const { chainId, id, hash } = transaction

  logger.debug('watchOnChainTransactionSaga', 'watchTransaction', 'Watching for updates for tx:', hash)
  const provider = yield* call(getProvider, chainId)
  const options = isUniswapX(transaction) ? undefined : transaction.options
  const timeoutTask = yield* fork(handleTimeout, transaction, apolloClient, provider)
  const listenForAppBackgrounded = options && !options.appBackgroundedWhilePending

  const { updatedTransaction, cancelTx, replace, invalidated, appBackgrounded } = yield* race({
    updatedTransaction: call(waitForRemoteUpdate, transaction, provider),
    cancelTx: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
    invalidated: call(waitForTxnInvalidated, chainId, id, options?.request.nonce),
    ...(listenForAppBackgrounded ? { appBackgrounded: call(watchForAppBackgrounded) } : {}),
  })

  if (timeoutTask.isRunning()) {
    yield* cancel(timeoutTask)
  }

  // `cancelTx` and `updatedTransaction` conditions apply to both Classic and UniswapX transactions
  if (cancelTx) {
    // reset watcher for the current txn, as it can still be mined (or invalidated by the new txn)
    yield* fork(watchTransaction, { transaction, apolloClient })
    // Cancel the current txn, which submits a new txn on chain and monitored in state
    yield* call(attemptCancelTransaction, transaction, cancelTx)
    return
  }

  if (updatedTransaction) {
    if (isFinalizedTx(updatedTransaction)) {
      // Update the store with tx receipt details
      yield* call(finalizeTransaction, { transaction: updatedTransaction, apolloClient })
      return
    } else {
      // Update transaction with the new status, which will trigger a new transaction watcher
      yield* put(transactionActions.updateTransaction(updatedTransaction))
    }
  }

  // `replace`, `invalidated` and `appBackgrounded` conditions do not apply to UniswapX orders
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

  if (appBackgrounded) {
    // Update transaction with the flag, which will trigger a new transaction watcher
    yield* put(
      transactionActions.updateTransaction({
        ...transaction,
        options: { ...transaction.options, appBackgroundedWhilePending: true },
      }),
    )
  }
}
