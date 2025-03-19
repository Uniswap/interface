/* eslint-disable max-lines */
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { SwapEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber, BigNumberish, providers } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { call, cancel, delay, fork, put, race, select, take, takeEvery } from 'typed-redux-saga'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { fetchSwaps } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { SwapStatus } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { getGasPrice } from 'uniswap/src/features/gas/types'
import { findLocalGasStrategy } from 'uniswap/src/features/gas/utils'
import { DynamicConfigs, MainnetPrivateRpcConfigKey } from 'uniswap/src/features/gating/configs'
import { getDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { pushNotification, setNotificationStatus } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { refetchGQLQueries } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchGQLQueriesSaga'
import {
  FLASHBOTS_DEFAULT_BLOCK_RANGE,
  waitForFlashbotsProtectReceipt,
} from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { MobileAppsFlyerEvents, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  makeSelectTransaction,
  selectIncompleteTransactions,
  selectSwapTransactionsCount,
} from 'uniswap/src/features/transactions/selectors'
import {
  addTransaction,
  cancelTransaction,
  forceFetchFiatOnRampTransactions,
  replaceTransaction,
  transactionActions,
  updateTransaction,
  upsertFiatOnRampTransaction,
} from 'uniswap/src/features/transactions/slice'
import { getRouteAnalyticsData, tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import {
  BridgeTransactionDetails,
  FinalizedTransactionDetails,
  QueuedOrderStatus,
  TEMPORARY_TRANSACTION_STATUSES,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  isFinalizedTx,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { fetchFORTransaction } from 'wallet/src/features/fiatOnRamp/api'
import { attemptCancelTransaction } from 'wallet/src/features/transactions/cancelTransactionSaga'
import { OrderWatcher } from 'wallet/src/features/transactions/orderWatcherSaga'
import { attemptReplaceTransaction } from 'wallet/src/features/transactions/replaceTransactionSaga'
import {
  getDiff,
  getFinalizedTransactionStatus,
  getPercentageError,
  isFORTransaction,
  receiptFromEthersReceipt,
} from 'wallet/src/features/transactions/utils'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export const SWAP_STATUS_TO_TX_STATUS: { [key in SwapStatus]: TransactionStatus } = {
  [SwapStatus.PENDING]: TransactionStatus.Pending,
  [SwapStatus.SUCCESS]: TransactionStatus.Success,
  [SwapStatus.NOT_FOUND]: TransactionStatus.Unknown,
  [SwapStatus.FAILED]: TransactionStatus.Failed,
  [SwapStatus.EXPIRED]: TransactionStatus.Expired,
}

const FINALIZED_BRIDGE_SWAP_STATUS = [SwapStatus.SUCCESS, SwapStatus.FAILED, SwapStatus.EXPIRED]
const MIN_BRIDGE_WAIT_TIME = ONE_SECOND_MS * 3

export function* transactionWatcher({ apolloClient }: { apolloClient: ApolloClient<NormalizedCacheObject> }) {
  logger.debug('transactionWatcherSaga', 'transactionWatcher', 'Starting tx watcher')

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
    const { payload: transaction } = yield* take<ReturnType<typeof addTransaction>>([
      addTransaction.type,
      updateTransaction.type,
    ])
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

export function* fetchUpdatedFORTransaction(
  transaction: FORTransactionDetails,
  forceFetch: boolean,
  activeAccountAddress: Address | null,
) {
  return yield* call(fetchFORTransaction, transaction, forceFetch, activeAccountAddress)
}

export function* watchFiatOnRampTransaction(transaction: FORTransactionDetails) {
  const { id } = transaction
  let forceFetch = false

  logger.debug('transactionWatcherSaga', 'watchFiatOnRampTransaction', 'Watching for updates for fiat onramp tx:', id)

  try {
    while (true) {
      const activeAddress = yield* select(selectActiveAccountAddress)
      const updatedTransaction = yield* fetchUpdatedFORTransaction(transaction, forceFetch, activeAddress)

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
      if (
        updatedTransaction.typeInfo.type !== TransactionType.LocalOnRamp &&
        updatedTransaction.typeInfo.type !== TransactionType.LocalOffRamp
      ) {
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
  const options = isUniswapX(transaction) ? undefined : transaction.options
  const timeoutTask = yield* fork(handleTimeout, transaction)

  const { updatedTransaction, cancelTx, replace, invalidated } = yield* race({
    updatedTransaction: call(waitForRemoteUpdate, transaction, provider),
    cancelTx: call(waitForCancellation, chainId, id),
    replace: call(waitForReplacement, chainId, id),
    invalidated: call(waitForTxnInvalidated, chainId, id, options?.request.nonce),
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

function* handleTimeout(transaction: TransactionDetails) {
  if (
    isUniswapX(transaction) ||
    !transaction.options?.timeoutTimestampMs ||
    transaction.options.timeoutLogged ||
    !TEMPORARY_TRANSACTION_STATUSES.includes(transaction.status)
  ) {
    return
  }

  const delayToTimeout = transaction.options.timeoutTimestampMs - Date.now()
  if (delayToTimeout > 0) {
    yield* delay(delayToTimeout)
  }

  yield* call(logTransactionTimeout, transaction)
  yield* call(maybeLogGasEstimateAccuracy, transaction)
  // Mark as logged so we don't log it again
  yield* put(
    transactionActions.updateTransactionWithoutWatch({
      ...transaction,
      options: { ...transaction.options, timeoutLogged: true },
    }),
  )
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
        file: 'transactionWatcherSaga',
        function: 'watchTransaction',
      },
      extra: { transaction },
    })
    return undefined
  }

  if (isClassic(transaction) && transaction.options?.submitViaPrivateRpc) {
    try {
      // Flashbots transactions won't return a receipt until they're included, and will fail silently.
      // We need to use Flashbots Protect API to get a status update until the tx is included or fails.
      // @see {@link https://protect.flashbots.net/tx/docs}
      const flashbotsReceipt = yield* call(waitForFlashbotsProtectReceipt, hash)

      switch (flashbotsReceipt.status) {
        case 'FAILED':
          logger.warn(
            'transactionWatcherSaga',
            'waitForRemoteUpdate',
            `Flashbots Protect transaction failed with simulation error: ${flashbotsReceipt.simError}`,
            { transaction, flashbotsReceipt },
          )
          return { ...transaction, status: TransactionStatus.Failed }
        case 'CANCELLED':
          return { ...transaction, status: TransactionStatus.Canceled }
        case 'UNKNOWN': // Transaction not found by Flashbots Protect, might have been submitted by another provider
        case 'INCLUDED': // Transaction successfully included in a block
        default:
        // Continue with the regular logic, which will try to fetch the ethers receipt
      }
    } catch (error) {
      logger.error('Error fetching Flashbots Protect transaction status', {
        tags: {
          file: 'transactionWatcherSaga',
          function: 'waitForRemoteUpdate',
        },
        extra: { transaction, error },
      })
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

function* waitForBridgingStatus(transaction: TransactionDetails) {
  const txHash = transaction.hash
  const chainId = toTradingApiSupportedChainId(transaction.chainId)

  if (!txHash || !chainId) {
    return TransactionStatus.Unknown
  }

  let swapStatus: SwapStatus | undefined
  const initialPollIntervalMs = 500
  const maxRetries = 10 // 500 ms, 1 second, 2 seconds...
  const backoffFactor = 2 // Each retry will double the wait time

  let pollIndex = 0
  yield* delay(MIN_BRIDGE_WAIT_TIME) // Wait minimum of 3 seconds before polling
  while (pollIndex < maxRetries) {
    const currentPollInterval = initialPollIntervalMs * Math.pow(backoffFactor, pollIndex)
    logger.debug('transactionWatcherSaga', `[${txHash}] waitForBridgingStatus`, 'polling for status', {
      pollIndex,
      currentPollInterval,
    })
    yield* delay(currentPollInterval)

    const data = yield* call(fetchSwaps, {
      txHashes: [txHash],
      chainId,
    })

    const currentSwapStatus = data.swaps?.[0]?.status
    logger.debug('transactionWatcherSaga', `[${txHash}] waitForBridgingStatus`, 'currentSwapStatus:', currentSwapStatus)
    if (currentSwapStatus && FINALIZED_BRIDGE_SWAP_STATUS.includes(currentSwapStatus)) {
      swapStatus = currentSwapStatus
      break
    }

    // Check if the redux store has been updated with a new status
    const selectTransactionById = yield* call(makeSelectTransaction)
    const updatedTransaction = yield* select(selectTransactionById, {
      address: transaction.from,
      chainId: transaction.chainId,
      txId: transaction.id,
    })

    if (
      updatedTransaction &&
      updatedTransaction.status !== TransactionStatus.Pending &&
      updatedTransaction.typeInfo.type === TransactionType.Bridge
    ) {
      logger.debug(
        'transactionWatcherSaga',
        `[${transaction.id}] waitForBridgingStatus`,
        'Local update found: ',
        updatedTransaction.status,
      )
      return updatedTransaction?.status
    }

    pollIndex++
  }
  logger.debug('transactionWatcherSaga', `[${transaction.id}] waitForBridgingStatus`, 'final swapStatus:', swapStatus)
  // If we didn't get a status after polling, assume it's failed
  return swapStatus ? SWAP_STATUS_TO_TX_STATUS[swapStatus] : TransactionStatus.Failed
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

/**
 * Monitor for transactions with the same nonce as the current transaction. If any duplicate is finalized, it means
 * the current transaction has been invalidated and wont be picked up on chain.
 */
export function* waitForTxnInvalidated(chainId: UniverseChainId, id: string, nonce: BigNumberish | undefined) {
  yield* race({
    sameNonceFinalized: call(waitForSameNonceFinalized, chainId, id, nonce),
    bridgeSendCompleted: call(waitForBridgeSendCompleted, chainId, id, nonce),
  })

  return true
}

export function* waitForSameNonceFinalized(chainId: UniverseChainId, id: string, nonce: BigNumberish | undefined) {
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
export function* waitForBridgeSendCompleted(chainId: UniverseChainId, id: string, nonce: BigNumberish | undefined) {
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
 * Send analytics events for finalized transactions
 */
export function logTransactionEvent(actionData: ReturnType<typeof transactionActions.finalizeTransaction>): void {
  const { payload } = actionData
  const { hash, chainId, addedTime, from, typeInfo, receipt, status, transactionOriginType } = payload
  const { gasUsed, effectiveGasPrice, confirmedTime } = receipt ?? {}
  const { type } = typeInfo

  // Send analytics event for swap success and failure
  if (type === TransactionType.Swap || type === TransactionType.Bridge) {
    const { quoteId, gasUseEstimate, inputCurrencyId, outputCurrencyId, transactedUSDValue } = typeInfo

    const swapProperties =
      type === TransactionType.Swap
        ? {
            tradeType: typeInfo.tradeType === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
            slippageTolerance: typeInfo.slippageTolerance,
            route: typeInfo.routeString,
            protocol: typeInfo.protocol,
            simulation_failure_reasons: typeInfo.simulationFailureReasons,
          }
        : undefined

    const bridgeProperties = {
      chain_id_in: chainId,
      chain_id_out: (type === TransactionType.Bridge && currencyIdToChain(typeInfo.outputCurrencyId)) || chainId,
    }

    const baseProperties = {
      routing: tradeRoutingToFillType({ routing: payload.routing, indicative: false }),
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
      gasUseEstimate,
      quoteId,
      submitViaPrivateRpc: isUniswapX(payload) ? false : payload.options.submitViaPrivateRpc,
      transactedUSDValue,
      ...swapProperties,
      ...bridgeProperties,
      ...getRouteAnalyticsData(payload),
    }

    if (isUniswapX(payload)) {
      const { orderHash } = payload
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
        const properties = { ...baseProperties, order_hash: orderHash, hash }
        logSwapSuccess(properties)
      } else {
        const properties = { ...baseProperties, order_hash: orderHash }
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_FAILED, properties)
      }
    } else {
      // All successful classic swaps should be tracked in redux with a tx hash.
      if (status !== TransactionStatus.Failed && !hash) {
        logger.error(new Error('Attempting to log swap event without a hash'), {
          tags: {
            file: 'transactionWatcherSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }

      if (status === TransactionStatus.Success) {
        logSwapSuccess({ ...baseProperties, hash })
      } else {
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_FAILED, { ...baseProperties, hash })
      }
    }
  }

  // Log metrics for confirmed transfers
  if (type === TransactionType.Send) {
    const { tokenAddress, recipient: toAddress, currencyAmountUSD } = typeInfo

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

export function logTransactionTimeout(transaction: TransactionDetails) {
  const useFlashbots = getDynamicConfigValue<DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey, boolean>(
    DynamicConfigs.MainnetPrivateRpc,
    MainnetPrivateRpcConfigKey.UseFlashbots,
    false,
  )

  const flashbotsBlockRange = getDynamicConfigValue<
    DynamicConfigs.MainnetPrivateRpc,
    MainnetPrivateRpcConfigKey,
    number
  >(DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey.FlashbotsBlockRange, FLASHBOTS_DEFAULT_BLOCK_RANGE)

  const sendAuthenticationHeader = getDynamicConfigValue<
    DynamicConfigs.MainnetPrivateRpc,
    MainnetPrivateRpcConfigKey,
    boolean
  >(DynamicConfigs.MainnetPrivateRpc, MainnetPrivateRpcConfigKey.SendFlashbotsAuthenticationHeader, false)

  sendAnalyticsEvent(WalletEventName.PendingTransactionTimeout, {
    use_flashbots: useFlashbots,
    flashbots_block_range: flashbotsBlockRange,
    send_authentication_header: sendAuthenticationHeader,
    chain_id: transaction.chainId,
    tx_hash: transaction.hash,
    private_rpc: (isClassic(transaction) && transaction.options.submitViaPrivateRpc) ?? false,
  })

  logger.warn('transactionWatcherSaga', 'logTransactionTimeout', 'Transaction timed out', {
    chain_id: transaction.chainId,
    use_flashbots: useFlashbots,
    flashbots_block_range: flashbotsBlockRange,
    send_authentication_header: sendAuthenticationHeader,
    transaction,
  })
}

function maybeLogGasEstimateAccuracy(transaction: TransactionDetails) {
  const { gasEstimates } = transaction.typeInfo
  if (!gasEstimates) {
    return
  }

  const currentTimeMs = Date.now()
  const transactionGasLimit = 'options' in transaction ? transaction.options.request.gasLimit : undefined
  const userSubmissionTimestampMs = 'options' in transaction ? transaction.options.userSubmissionTimestampMs : undefined
  const rpcSubmissionTimestampMs = 'options' in transaction ? transaction.options.rpcSubmissionTimestampMs : undefined
  const rpcSubmissionDelayMs = 'options' in transaction ? transaction.options.rpcSubmissionDelayMs : undefined
  const completionDelayMs = 'options' in transaction ? transaction.options.currentBlockFetchDelayMs : undefined
  const blockSubmitted = 'options' in transaction ? transaction.options.blockSubmitted : undefined
  const out_of_gas =
    !!transaction.receipt &&
    !!transactionGasLimit &&
    transaction.status === TransactionStatus.Failed &&
    BigNumber.from(transactionGasLimit).toString() === transaction.receipt?.gasUsed.toString()
  const timed_out =
    !transaction.receipt &&
    'options' in transaction &&
    !!transaction.options.timeoutTimestampMs &&
    currentTimeMs > transaction.options.timeoutTimestampMs

  for (const estimate of [gasEstimates.activeEstimate, ...(gasEstimates.shadowEstimates || [])]) {
    const gasUseDiff = getDiff(estimate.gasLimit, transaction.receipt?.gasUsed)
    const gasPriceDiff = getDiff(getGasPrice(estimate), transaction.receipt?.effectiveGasPrice)
    const localGasStrategy = findLocalGasStrategy(
      estimate,
      transaction.typeInfo.type === TransactionType.Swap ? 'swap' : 'general',
    )

    sendAnalyticsEvent(WalletEventName.GasEstimateAccuracy, {
      tx_hash: transaction.hash,
      transaction_type: transaction.typeInfo.type,
      chain_id: transaction.chainId,
      final_status: transaction.status,
      time_to_confirmed_ms: getDiff(currentTimeMs, rpcSubmissionTimestampMs),
      blocks_to_confirmed: getDiff(transaction.receipt?.blockNumber, blockSubmitted),
      user_experienced_delay_ms: getDiff(currentTimeMs, userSubmissionTimestampMs),
      send_to_confirmation_delay_ms: getDiff(transaction.receipt?.confirmedTime, rpcSubmissionTimestampMs),
      rpc_submission_delay_ms: rpcSubmissionDelayMs,
      current_block_fetch_delay_ms: completionDelayMs,
      gas_use_diff: gasUseDiff,
      gas_use_diff_percentage: getPercentageError(gasUseDiff, estimate.gasLimit),
      gas_used: transaction.receipt?.gasUsed,
      gas_price_diff: gasPriceDiff,
      gas_price_diff_percentage: getPercentageError(gasPriceDiff, getGasPrice(estimate)),
      gas_price: transaction.receipt?.effectiveGasPrice,
      max_priority_fee_per_gas: 'maxPriorityFeePerGas' in estimate ? estimate.maxPriorityFeePerGas : undefined,
      out_of_gas,
      private_rpc: isClassic(transaction) ? transaction.options.submitViaPrivateRpc ?? false : false,
      is_shadow: estimate !== gasEstimates.activeEstimate,
      name: localGasStrategy?.conditions.name,
      display_limit_inflation_factor: localGasStrategy?.strategy.displayLimitInflationFactor,
      timed_out,
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
  const activeAddress = yield* select(selectActiveAccountAddress)
  yield* refetchGQLQueries({
    transaction,
    apolloClient,
    activeAddress,
  })

  if (transaction.typeInfo.type === TransactionType.Swap || transaction.typeInfo.type === TransactionType.Bridge) {
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

export function logSwapSuccess(
  analyticsProps: Parameters<typeof sendAnalyticsEvent<SwapEventName.SWAP_TRANSACTION_COMPLETED>>[1],
) {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED, {
    ...analyticsProps,
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
  })
}
