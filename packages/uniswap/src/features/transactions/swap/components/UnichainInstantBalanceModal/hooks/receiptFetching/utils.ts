import { BigNumber } from '@ethersproject/bignumber'
import { TradeType } from '@uniswap/sdk-core'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { getRouteAnalyticsData, tradeRoutingToFillType } from 'uniswap/src/features/transactions/swap/analytics'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { SwapEventType, timestampTracker } from 'uniswap/src/features/transactions/swap/utils/SwapEventTimestampTracker'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isWebApp } from 'utilities/src/platform'

export const NO_OUTPUT_ERROR = 'No output amount found in receipt logs'

interface ReportOutputAmountParams {
  outputAmount: BigNumber
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

/**
 * Reports the output amount to the swap form and navigates to the instant balance modal
 */
export function reportOutputAmount({ outputAmount, updateSwapForm, setScreen }: ReportOutputAmountParams): void {
  updateSwapForm({
    instantOutputAmountRaw: outputAmount.toString(),
  })

  setScreen(TransactionScreen.UnichainInstantBalance)
}

interface ResetSwapFormParams {
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

/**
 * Resets the swap form to initial state and returns to the form screen
 */
export function resetSwapFormAndReturnToForm({ updateSwapForm, setScreen }: ResetSwapFormParams): void {
  updateSwapForm({
    exactAmountFiat: undefined,
    exactAmountToken: '',
    isSubmitting: false,
    showPendingUI: false,
    isConfirmed: false,
    instantOutputAmountRaw: undefined,
    instantReceiptFetchTime: undefined,
    txHash: undefined,
    txHashReceivedTime: undefined,
  })
  setScreen(TransactionScreen.Form)
}

/**
 * TODO(SWAP-407): do NOT copy this logic when moving to a saga; we should restore the original watcher+logging logic once we make the switch
 * Logs swap transaction completion analytics for web app
 */
export function logSwapTransactionCompleted(updatedTransaction: TransactionDetails): void {
  if (updatedTransaction.typeInfo.type !== TransactionType.Swap || !updatedTransaction.hash || !isWebApp) {
    return
  }

  const { hash, chainId, addedTime, from, typeInfo, transactionOriginType, routing, id, receipt } = updatedTransaction
  const gasUsed = receipt?.gasUsed
  const effectiveGasPrice = receipt?.effectiveGasPrice
  const confirmedTime = receipt?.confirmedTime
  const includesDelegation = 'options' in updatedTransaction ? updatedTransaction.options.includesDelegation : undefined
  const isSmartWalletTransaction =
    'options' in updatedTransaction ? updatedTransaction.options.isSmartWalletTransaction : undefined

  const {
    quoteId,
    gasUseEstimate,
    inputCurrencyId,
    outputCurrencyId,
    transactedUSDValue,
    tradeType,
    slippageTolerance,
    routeString,
    protocol,
    simulationFailureReasons,
  } = typeInfo

  const baseProperties = {
    routing: tradeRoutingToFillType({ routing, indicative: false }),
    id,
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
    submitViaPrivateRpc:
      'options' in updatedTransaction ? (updatedTransaction.options.submitViaPrivateRpc ?? false) : undefined,
    transactedUSDValue,
    tradeType: tradeType === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
    slippageTolerance,
    route: routeString,
    protocol,
    simulation_failure_reasons: simulationFailureReasons,
    includes_delegation: includesDelegation,
    is_smart_wallet_transaction: isSmartWalletTransaction,
    ...getRouteAnalyticsData(updatedTransaction),
  }

  // Log swap success with time-to-swap tracking
  const hasSetSwapSuccess = timestampTracker.hasTimestamp(SwapEventType.FirstSwapSuccess)
  const elapsedTime = timestampTracker.setElapsedTime(SwapEventType.FirstSwapSuccess)

  sendAnalyticsEvent(SwapEventName.SwapTransactionCompleted, {
    ...baseProperties,
    time_to_swap: hasSetSwapSuccess ? undefined : elapsedTime,
    time_to_swap_since_first_input: hasSetSwapSuccess
      ? undefined
      : timestampTracker.getElapsedTime(SwapEventType.FirstSwapSuccess, SwapEventType.FirstSwapAction),
  })
}
