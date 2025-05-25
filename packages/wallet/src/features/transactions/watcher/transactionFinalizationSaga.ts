import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { SwapEventName } from '@uniswap/analytics-events'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { getGasPrice } from 'uniswap/src/features/gas/types'
import { findLocalGasStrategy } from 'uniswap/src/features/gas/utils'
import { Experiments, PrivateRpcProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import { setNotificationStatus } from 'uniswap/src/features/notifications/slice'
import { refetchGQLQueries } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchGQLQueriesSaga'
import { FLASHBOTS_DEFAULT_REFUND_PERCENT } from 'uniswap/src/features/providers/FlashbotsRpcProvider'
import { DEFAULT_FLASHBOTS_ENABLED } from 'uniswap/src/features/providers/createEthersProvider'
import { MobileAppsFlyerEvents, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent, sendAppsFlyerEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapTransactionsCount } from 'uniswap/src/features/transactions/selectors'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import { getRouteAnalyticsData, tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  FinalizedTransactionDetails,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { getDiff, getOptionalTransactionProperty, getPercentageError } from 'wallet/src/features/transactions/utils'
import { selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export function* finalizeTransaction({
  apolloClient,
  transaction,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  transaction: FinalizedTransactionDetails
}): Generator<unknown> {
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
      yield* call(sendAppsFlyerEvent, MobileAppsFlyerEvents.SwapCompleted)
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
            file: 'transactionFinalizationSaga',
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
            file: 'transactionFinalizationSaga',
            function: 'logTransactionEvent',
          },
          extra: { payload },
        })
        return
      }

      if (status === TransactionStatus.Success) {
        logSwapSuccess({ ...baseProperties, hash })
      } else {
        // Log to amplitude
        sendAnalyticsEvent(SwapEventName.SWAP_TRANSACTION_FAILED, { ...baseProperties, hash })
        // Log to datadog
        if (type === TransactionType.Swap && status === TransactionStatus.Failed) {
          logger.warn('swapFlowLoggers', 'logSwapFinalized', 'Onchain Swap Failure', {
            hash,
            chainId,
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

export function logTransactionTimeout(transaction: TransactionDetails): void {
  const flashbotsEnabled = getExperimentValue<Experiments.PrivateRpc, PrivateRpcProperties, boolean>(
    Experiments.PrivateRpc,
    PrivateRpcProperties.FlashbotsEnabled,
    DEFAULT_FLASHBOTS_ENABLED,
  )

  const flashbotsRefundPercent = getExperimentValue<Experiments.PrivateRpc, PrivateRpcProperties, number>(
    Experiments.PrivateRpc,
    PrivateRpcProperties.RefundPercent,
    FLASHBOTS_DEFAULT_REFUND_PERCENT,
  )

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
  const { gasEstimates } = transaction.typeInfo
  if (!gasEstimates) {
    return
  }

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
      app_backgrounded_while_pending,
    })
  }
}

function logSwapSuccess(
  analyticsProps: Parameters<typeof sendAnalyticsEvent<SwapEventName.SWAP_TRANSACTION_COMPLETED>>[1],
): void {
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

export function* watchTransactionEvents(): Generator<unknown> {
  // Watch for finalized transactions to send analytics events
  yield* takeEvery(transactionActions.finalizeTransaction.type, logTransactionEvent)
}
