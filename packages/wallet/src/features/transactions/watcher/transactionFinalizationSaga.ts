import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { SharedQueryClient } from '@universe/api'
import { Experiments, getExperimentValue, PrivateRpcProperties } from '@universe/gating'
import { BigNumber } from 'ethers'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { getGasPrice } from 'uniswap/src/features/gas/types'
import { findLocalGasStrategy } from 'uniswap/src/features/gas/utils'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice/slice'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { refetchQueries } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchQueriesSaga'
import {
  DEFAULT_FLASHBOTS_ENABLED,
  FLASHBOTS_DEFAULT_REFUND_PERCENT,
} from 'uniswap/src/features/providers/FlashbotsCommon'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { MobileAppsFlyerEvents, SwapEventName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapTransactionsCount } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { getRouteAnalyticsData, tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import { isNonInstantFlashblockTransactionType } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { getIsFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import {
  FinalizedTransactionDetails,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { createDelegationQueryOptions } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { getDiff, getOptionalTransactionProperty, getPercentageError } from 'wallet/src/features/transactions/utils'
import {
  selectActiveAccountAddress,
  selectAllSignerMnemonicAccountAddresses,
} from 'wallet/src/features/wallet/selectors'

export function* finalizeTransaction({
  apolloClient,
  transaction,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  transaction: FinalizedTransactionDetails
}): Generator<unknown> {
  yield* put(transactionActions.finalizeTransaction(transaction))

  const isUnichainFlashblock = getIsFlashblocksEnabled(transaction.chainId)
  const shouldSkipSuccessNotification =
    isUnichainFlashblock &&
    'isFlashblockTxWithinThreshold' in transaction &&
    transaction.isFlashblockTxWithinThreshold &&
    !isNonInstantFlashblockTransactionType(transaction)

  // Only show notification badge if not a fast flashblock transaction
  if (!shouldSkipSuccessNotification) {
    yield* put(setNotificationStatus({ address: transaction.from, hasNotifications: true }))
  }

  // Refetch data when a local tx has confirmed
  const activeAddress = yield* select(selectActiveAccountAddress)
  yield* refetchQueries({
    transaction,
    apolloClient,
    activeAddress,
  })

  const { chains } = yield* call(getEnabledChainIdsSaga, Platform.EVM)
  const accountAddresses = yield* select(selectAllSignerMnemonicAccountAddresses)

  try {
    logger.debug(
      'transactionFinalizationSaga',
      'finalizeTransaction',
      'invalidating + refetching wallet delegation queries',
    )
    yield* call(invalidateAndRefetchWalletDelegationQueries, { accountAddresses, chainIds: chains })
  } catch (error) {
    logger.debug('transactionFinalizationSaga', 'finalizeTransaction', 'error refetching wallet delegation queries', {
      error,
    })
  }

  if (transaction.typeInfo.type === TransactionType.Swap || transaction.typeInfo.type === TransactionType.Bridge) {
    const hasDoneOneSwap = (yield* select(selectSwapTransactionsCount)) === 1
    if (hasDoneOneSwap) {
      // Only log event if it's a user's first ever swap
      yield* call(sendAppsFlyerEvent, MobileAppsFlyerEvents.SwapCompleted)
    }
  }
}

export async function invalidateAndRefetchWalletDelegationQueries(input: {
  accountAddresses: Address[]
  chainIds: UniverseChainId[]
}): Promise<void> {
  const queryOptions = createDelegationQueryOptions(input)
  await SharedQueryClient.invalidateQueries(queryOptions)
  await SharedQueryClient.fetchQuery({ ...queryOptions, gcTime: 0 })
}

/**
 * Send analytics events for finalized transactions
 */
// eslint-disable-next-line complexity
export function logTransactionEvent(actionData: ReturnType<typeof transactionActions.finalizeTransaction>): void {
  const { payload } = actionData
  const { hash, chainId, addedTime, from, typeInfo, receipt, status, transactionOriginType } = payload
  const { type } = typeInfo

  // Send analytics event for swap success and failure
  if (type === TransactionType.Swap || type === TransactionType.Bridge) {
    const { gasUsed, effectiveGasPrice, confirmedTime } = receipt ?? {}
    const isOnChainTransaction = 'options' in payload
    const includesDelegation = isOnChainTransaction ? payload.options.includesDelegation : undefined
    const isSmartWalletTransaction = isOnChainTransaction ? payload.options.isSmartWalletTransaction : undefined

    const { quoteId, gasUseEstimate, inputCurrencyId, outputCurrencyId, transactedUSDValue } = typeInfo

    const swapProperties =
      type === TransactionType.Swap
        ? {
            tradeType: typeInfo.tradeType === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
            slippageTolerance: typeInfo.slippageTolerance,
            route: typeInfo.routeString,
            protocol: typeInfo.protocol,
            simulation_failure_reasons: typeInfo.simulationFailureReasons,
            includes_delegation: includesDelegation,
            is_smart_wallet_transaction: isSmartWalletTransaction,
          }
        : undefined

    const bridgeProperties = {
      chain_id_in: chainId,
      chain_id_out: (type === TransactionType.Bridge && currencyIdToChain(typeInfo.outputCurrencyId)) || chainId,
    }

    const baseProperties = {
      routing: tradeRoutingToFillType({ routing: payload.routing, indicative: false }),
      id: payload.id,
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
      is_final_step: typeInfo.isFinalStep ?? true, // If no `isFinalStep` is provided, we assume it's not a multi-step transaction and default to `true`
      swap_start_timestamp: typeInfo.swapStartTimestamp,
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
            file: 'transactionFinalizationSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }

      switch (status) {
        case TransactionStatus.Success:
          logSwapSuccess({ ...baseProperties, order_hash: orderHash, hash })
          break
        case TransactionStatus.Canceled:
          sendAnalyticsEvent(WalletEventName.SwapTransactionCancelled, {
            ...baseProperties,
            order_hash: orderHash,
          })
          break
        default:
          sendAnalyticsEvent(SwapEventName.SwapTransactionFailed, { ...baseProperties, order_hash: orderHash })
      }
    } else {
      // All successful classic swaps should be tracked in redux with a tx hash.
      if (status !== TransactionStatus.Failed && !hash) {
        logger.error(new Error('Attempting to log swap event without a hash'), {
          tags: {
            file: 'transactionFinalizationSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }

      switch (status) {
        case TransactionStatus.Success:
          logSwapSuccess({ ...baseProperties, hash })
          break
        case TransactionStatus.Canceled:
          sendAnalyticsEvent(WalletEventName.SwapTransactionCancelled, {
            ...baseProperties,
            hash,
            replaced_transaction_hash: payload.options.replacedTransactionHash,
          })
          break
        default:
          // Log to amplitude
          sendAnalyticsEvent(SwapEventName.SwapTransactionFailed, { ...baseProperties, hash })
          // Log to datadog
          if (type === TransactionType.Swap && status === TransactionStatus.Failed) {
            logger.warn('swapFlowLoggers', 'logSwapFinalized', 'Onchain Swap Failure', {
              ...baseProperties,
              hash,
              chainLabel: getChainLabel(chainId),
              quoteId,
              inputCurrencyId,
              outputCurrencyId,
              gasUsed,
              gasUseEstimate,
            })
          }
      }
    }
  }

  // Log metrics for confirmed transfers
  if (type === TransactionType.Send) {
    logSend(typeInfo, chainId)
  }

  maybeLogGasEstimateAccuracy(payload)
}

function logSend(typeInfo: SendTokenTransactionInfo, chainId: UniverseChainId): void {
  const { tokenAddress, recipient: toAddress, currencyAmountUSD } = typeInfo

  const amountUSD = currencyAmountUSD ? parseFloat(currencyAmountUSD.toFixed(2)) : undefined

  sendAnalyticsEvent(WalletEventName.TransferCompleted, {
    chainId,
    tokenAddress,
    toAddress,
    amountUSD,
  })
}

export function logTransactionTimeout(transaction: TransactionDetails): void {
  const flashbotsEnabled = getExperimentValue({
    experiment: Experiments.PrivateRpc,
    param: PrivateRpcProperties.FlashbotsEnabled,
    defaultValue: DEFAULT_FLASHBOTS_ENABLED,
  })

  const flashbotsRefundPercent = getExperimentValue({
    experiment: Experiments.PrivateRpc,
    param: PrivateRpcProperties.RefundPercent,
    defaultValue: FLASHBOTS_DEFAULT_REFUND_PERCENT,
  })

  sendAnalyticsEvent(WalletEventName.PendingTransactionTimeout, {
    use_flashbots: flashbotsEnabled,
    flashbots_refund_percent: flashbotsRefundPercent,
    chain_id: transaction.chainId,
    tx_hash: transaction.hash,
    address: transaction.from,
    private_rpc: (isClassic(transaction) && transaction.options.submitViaPrivateRpc) ?? false,
  })

  logger.warn('transactionFinalizationSaga', 'logTransactionTimeout', 'Transaction timed out', {
    chain_id: transaction.chainId,
    flashbots_enabled: flashbotsEnabled,
    flashbots_refund_percent: flashbotsRefundPercent,
    transaction,
    address: transaction.from,
  })
}

function maybeLogGasEstimateAccuracy(transaction: TransactionDetails): void {
  const { gasEstimate } = transaction.typeInfo
  const currentTimeMs = Date.now()
  const transactionGasLimit = getOptionalTransactionProperty(transaction, (options) => options.request.gasLimit)
  const userSubmissionTimestampMs = getOptionalTransactionProperty(
    transaction,
    (options) => options.userSubmissionTimestampMs,
  )
  const rpcSubmissionTimestampMs = getOptionalTransactionProperty(
    transaction,
    (options) => options.rpcSubmissionTimestampMs,
  )
  const rpcSubmissionDelayMs = getOptionalTransactionProperty(transaction, (options) => options.rpcSubmissionDelayMs)
  const signTransactionDelayMs = getOptionalTransactionProperty(
    transaction,
    (options) => options.signTransactionDelayMs,
  )
  const completionDelayMs = getOptionalTransactionProperty(transaction, (options) => options.currentBlockFetchDelayMs)
  const blockSubmitted = getOptionalTransactionProperty(transaction, (options) => options.blockSubmitted)
  const app_backgrounded_while_pending = getOptionalTransactionProperty(
    transaction,
    (options) => options.appBackgroundedWhilePending,
  )
  const out_of_gas =
    !!transaction.receipt &&
    !!transactionGasLimit &&
    transaction.status === TransactionStatus.Failed &&
    BigNumber.from(transactionGasLimit).toString() === transaction.receipt.gasUsed.toString()
  const timed_out =
    !transaction.receipt &&
    'options' in transaction &&
    !!transaction.options.timeoutTimestampMs &&
    currentTimeMs > transaction.options.timeoutTimestampMs

  const gasUseDiff = getDiff(gasEstimate?.gasLimit, transaction.receipt?.gasUsed)
  const gasPriceDiff = getDiff(getGasPrice(gasEstimate), transaction.receipt?.effectiveGasPrice)
  const localGasStrategy = gasEstimate
    ? findLocalGasStrategy(gasEstimate, transaction.typeInfo.type === TransactionType.Swap ? 'swap' : 'general')
    : undefined

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
    sign_transaction_delay_ms: signTransactionDelayMs,
    current_block_fetch_delay_ms: completionDelayMs,
    gas_use_diff: gasUseDiff,
    gas_use_diff_percentage: getPercentageError(gasUseDiff, gasEstimate?.gasLimit),
    gas_used: transaction.receipt?.gasUsed,
    gas_price_diff: gasPriceDiff,
    gas_price_diff_percentage: getPercentageError(gasPriceDiff, getGasPrice(gasEstimate)),
    gas_price: transaction.receipt?.effectiveGasPrice,
    max_priority_fee_per_gas:
      gasEstimate && 'maxPriorityFeePerGas' in gasEstimate ? gasEstimate.maxPriorityFeePerGas : undefined,
    out_of_gas,
    private_rpc: isClassic(transaction) ? (transaction.options.submitViaPrivateRpc ?? false) : false,
    is_shadow: false,
    name: localGasStrategy?.conditions.name,
    display_limit_inflation_factor: localGasStrategy?.strategy.displayLimitInflationFactor,
    timed_out,
    app_backgrounded_while_pending,
  })
}

function logSwapSuccess(
  analyticsProps: Parameters<typeof sendAnalyticsEvent<SwapEventName.SwapTransactionCompleted>>[1],
): void {
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  sendAnalyticsEvent(SwapEventName.SwapTransactionCompleted, {
    ...analyticsProps,
    // We only log the time-to-swap metric for the first swap of a session,
    // so if it was previously set we log undefined here.
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
  })
}

export function* watchTransactionEvents(): Generator<unknown> {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
