import { TradingApi } from '@universe/api'
import ms from 'ms'
import { call, type SagaGenerator } from 'typed-redux-saga'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { type SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import {
  HandleSwapWalletCallStepParams,
  type HandleSwapStepParams,
  type TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { type ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { type PlanAnalyticsFields, planAnalyticsToCamelCase } from 'uniswap/src/features/transactions/swap/plan/types'
import { handleSwitchChains } from 'uniswap/src/features/transactions/swap/plan/utils'
import { getSwapTxRequest } from 'uniswap/src/features/transactions/swap/steps/swap'
import type { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { type ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  type BridgeTrade,
  type ChainedActionTrade,
  type ClassicTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import {
  isJupiter,
  requireRouting,
  UNISWAPX_ROUTING_VARIANTS,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { createMonitoredSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS, ZERO_PERCENT } from '~/constants/misc'
import { formatSwapSignedAnalyticsEventProperties } from '~/lib/utils/analytics'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { jupiterSwap } from '~/state/sagas/transactions/solana'
import { sendSwapSignedEvent } from '~/state/sagas/transactions/swapSignedAnalytics'
import { handleUniswapXSignatureStep } from '~/state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
  waitForBatch,
} from '~/state/sagas/transactions/utils'
import { type VitalTxFields } from '~/state/transactions/types'

export function* handleSwapTransactionStep(params: HandleSwapStepParams): SagaGenerator<string> {
  const { trade, step, signature, analytics, onTransactionHash, planId } = params

  const info = getSwapTransactionInfo({
    trade,
    swapStartTimestamp: analytics.swap_start_timestamp,
    planAnalytics: planAnalyticsToCamelCase(analytics),
    transactedUSDValue: analytics.token_in_amount_usd,
    rwaAnalytics: {
      marketClosed: analytics.market_closed,
      priceWarning: analytics.price_warning,
      tokenInStocks: analytics.token_in_stocks,
      tokenOutStocks: analytics.token_out_stocks,
    },
  })
  const txRequest = yield* call(getSwapTxRequest, step, signature)

  const onModification = ({ hash, data }: VitalTxFields) => {
    sendAnalyticsEvent(SwapEventName.SwapModifiedInWallet, {
      ...analytics,
      txHash: hash,
      expected: txRequest.data?.toString() ?? '',
      actual: data,
    })
  }

  // Now that we have the txRequest, we can create a definitive SwapTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest }
  const hash = yield* call(handleOnChainStep, {
    ...params,
    info,
    step: onChainStep,
    ignoreInterrupt: true, // We avoid interruption during the swap step, since it is too late to give user a new trade once the swap is submitted.
    shouldWaitForConfirmation: false,
    onModification,
  })

  handleSwapTransactionAnalytics({ ...params, hash })

  const chainId = trade.inputAmount.currency.chainId

  if (!planId) {
    popupRegistry.addPopup(
      { type: PopupType.Transaction, hash },
      hash,
      isL2ChainId(chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS,
    )
  }

  // Update swap form store with actual transaction hash
  if (onTransactionHash) {
    onTransactionHash(hash)
  }

  return hash
}

export function createHandleSwapTransactionWalletCallStep(ctx: {
  disableOneClickSwap: () => void
  waitForTxHash?: boolean
}) {
  return function* handleSwapTransactionWalletCallStep(params: HandleSwapWalletCallStepParams) {
    const { trade, step, analytics, planId } = params

    const info = getSwapTransactionInfo({
      trade,
      swapStartTimestamp: analytics.swap_start_timestamp,
      planAnalytics: planAnalyticsToCamelCase(analytics),
      transactedUSDValue: analytics.token_in_amount_usd,
      rwaAnalytics: {
        marketClosed: analytics.market_closed,
        priceWarning: analytics.price_warning,
        tokenInStocks: analytics.token_in_stocks,
        tokenOutStocks: analytics.token_out_stocks,
      },
    })

    const batchId = yield* handleAtomicSendCalls({
      ...params,
      info,
      step,
      ignoreInterrupt: true, // We avoid interruption during the swap step, since it is too late to give user a new trade once the swap is submitted.
      shouldWaitForConfirmation: false,
      disableOneClickSwap: ctx.disableOneClickSwap,
    })
    handleSwapTransactionAnalytics({ ...params, batchId })

    if (!planId) {
      popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)
    }

    if (!ctx.waitForTxHash) {
      return { batchId }
    }

    const hash = yield* call(waitForBatch, batchId, step)
    return { batchId, hash }
  }
}

function handleSwapTransactionAnalytics(params: {
  trade: ClassicTrade | BridgeTrade | ChainedActionTrade
  analytics: SwapTradeBaseProperties & PlanAnalyticsFields
  hash?: string
  batchId?: string
}) {
  const { trade, analytics, hash, batchId } = params

  sendSwapSignedEvent({
    analytics,
    properties: formatSwapSignedAnalyticsEventProperties({
      trade,
      allowedSlippage: trade.slippageTolerance ? slippageToleranceToPercent(trade.slippageTolerance) : ZERO_PERCENT,
      fiatValues: {
        amountIn: analytics.token_in_amount_usd,
        amountOut: analytics.token_out_amount_usd,
        feeUsd: analytics.fee_usd,
      },
      txHash: hash,
      portfolioBalanceUsd: analytics.total_balances_usd,
      trace: analytics,
      isBatched: Boolean(batchId),
      includedPermitTransactionStep: analytics.included_permit_transaction_step,
      batchId,
      planAnalytics: planAnalyticsToCamelCase(analytics),
      priceSource: analytics.price_source,
    }),
  })
}

type SwapParams = SwapExecutionCallbacks & {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  address: string
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSwapTxContext
  getOnPressRetry: (error: Error | undefined) => (() => void) | undefined
  // TODO(WEB-7763): Upgrade jotai to v2 to avoid need for prop drilling `disableOneClickSwap`
  disableOneClickSwap: () => void
  onTransactionHash?: (hash: string) => void
  swapStartTimestamp?: number
}

function* swap(params: SwapParams) {
  const { address, disableOneClickSwap, setCurrentStep, swapTxContext, analytics, onSuccess, onFailure, setSteps } =
    params
  const { trade } = swapTxContext

  const { chainSwitchFailed } = yield* call(handleSwitchChains, {
    selectChain: params.selectChain,
    startChainId: params.startChainId,
    swapTxContext,
  })
  if (chainSwitchFailed) {
    onFailure()
    return
  }

  const steps = yield* call(generateSwapTransactionSteps, swapTxContext)
  setSteps(steps)

  let signature: string | undefined
  let step: TransactionStep | undefined

  const handleSwapTransactionWalletCallStep = createHandleSwapTransactionWalletCallStep({ disableOneClickSwap })

  try {
    // TODO(SWAP-287): Integrate jupiter swap into TransactionStep, rather than special-casing.
    if (isJupiter(swapTxContext)) {
      yield* call(jupiterSwap, { ...params, swapTxContext })
      yield* call(onSuccess)
      return
    }

    for (step of steps) {
      switch (step.type) {
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          yield* call(handleApprovalTransactionStep, { address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { address, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Transaction: {
          yield* call(handlePermitTransactionStep, { address, step, setCurrentStep })
          break
        }
        case TransactionStepType.SwapTransaction:
        case TransactionStepType.SwapTransactionAsync: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionStep, {
            address,
            signature,
            step,
            setCurrentStep,
            trade,
            analytics,
            onTransactionHash: params.onTransactionHash,
          })
          break
        }
        case TransactionStepType.SwapTransactionWalletCall: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionWalletCallStep, {
            address,
            step,
            setCurrentStep,
            trade,
            analytics,
            disableOneClickSwap,
          })
          break
        }
        case TransactionStepType.UniswapXSignature: {
          requireRouting(trade, UNISWAPX_ROUTING_VARIANTS)
          yield* call(handleUniswapXSignatureStep, { address, step, setCurrentStep, trade, analytics })
          break
        }
        default: {
          throw new UnexpectedTransactionStateError(`Unexpected step type: ${step.type}`)
        }
      }
    }
  } catch (error) {
    const displayableError = getDisplayableError({ error, step })
    if (displayableError) {
      logger.error(displayableError, { tags: { file: 'swapSaga', function: 'swap' } })
    }
    const onPressRetry = params.getOnPressRetry(displayableError)
    onFailure(displayableError, onPressRetry)
    return
  }

  yield* call(onSuccess)
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga({ saga: swap, name: 'swapSaga', options: { timeoutDuration: ms('30m') } })
