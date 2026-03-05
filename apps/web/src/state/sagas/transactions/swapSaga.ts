import { TradingApi } from '@universe/api'
import { Experiments } from '@universe/gating'
import ms from 'ms'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { call, type SagaGenerator } from 'typed-redux-saga'
import { resolvePlatform } from 'uniswap/src/features/accounts/store/utils/flexibleInput'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { type SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { logExperimentQualifyingEvent } from 'uniswap/src/features/telemetry/utils/logExperimentQualifyingEvent'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import {
  HandleSwapBatchedStepParams,
  type HandleSwapStepParams,
  type TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import {
  type ExtractedBaseTradeAnalyticsProperties,
  getBaseTradeAnalyticsProperties,
} from 'uniswap/src/features/transactions/swap/analytics'
import { getFlashblocksExperimentStatus } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { planActions } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { type PlanAnalyticsFields, planAnalyticsToCamelCase } from 'uniswap/src/features/transactions/swap/plan/types'
import { handleSwitchChains } from 'uniswap/src/features/transactions/swap/plan/utils'
import { getSwapTxRequest } from 'uniswap/src/features/transactions/swap/steps/swap'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  type SwapCallback,
  type SwapCallbackParams,
  type SwapExecutionCallbacks,
} from 'uniswap/src/features/transactions/swap/types/swapCallback'
import {
  PermitMethod,
  type ValidatedSwapTxContext,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  type BridgeTrade,
  type ChainedActionTrade,
  type ClassicTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import {
  isClassic,
  isJupiter,
  requireRouting,
  UNISWAPX_ROUTING_VARIANTS,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { createMonitoredSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useTotalBalancesUsdForAnalytics } from '~/appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS, ZERO_PERCENT } from '~/constants/misc'
import { useAccountsStore, useActiveAccount } from '~/features/accounts/store/hooks'
import useSelectChain from '~/hooks/useSelectChain'
import { formatSwapSignedAnalyticsEventProperties } from '~/lib/utils/analytics'
import { useSetOverrideOneClickSwapFlag } from '~/pages/Swap/settings/OneClickSwap'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { useGetOnPressRetry } from '~/state/sagas/transactions/retry'
import { jupiterSwap } from '~/state/sagas/transactions/solana'
import { handleUniswapXPlanSignatureStep, handleUniswapXSignatureStep } from '~/state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
  sendToast,
  waitForBatch,
} from '~/state/sagas/transactions/utils'
import { type VitalTxFields } from '~/state/transactions/types'

function* handleSwapTransactionStep(params: HandleSwapStepParams): SagaGenerator<string> {
  const { trade, step, signature, analytics, onTransactionHash, planId } = params

  const info = getSwapTransactionInfo({
    trade,
    swapStartTimestamp: analytics.swap_start_timestamp,
    planAnalytics: planAnalyticsToCamelCase(analytics),
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
  const { shouldLogQualifyingEvent, shouldShowModal } = getFlashblocksExperimentStatus({
    chainId,
    routing: trade.routing,
  })

  if (shouldLogQualifyingEvent) {
    logExperimentQualifyingEvent({
      experiment: Experiments.UnichainFlashblocksModal,
    })
  }

  // Show regular popup for control variant or ineligible swaps
  if (!shouldShowModal && !planId) {
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

function createHandleSwapTransactionBatchedStep(ctx: { disableOneClickSwap: () => void; waitForTxHash?: boolean }) {
  return function* handleSwapTransactionBatchedStep(params: HandleSwapBatchedStepParams) {
    const { trade, step, analytics, planId } = params

    const info = getSwapTransactionInfo({
      trade,
      swapStartTimestamp: analytics.swap_start_timestamp,
      planAnalytics: planAnalyticsToCamelCase(analytics),
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

  sendAnalyticsEvent(
    SwapEventName.SwapSigned,
    formatSwapSignedAnalyticsEventProperties({
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
    }),
  )
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

  const handleSwapTransactionBatchedStep = createHandleSwapTransactionBatchedStep({ disableOneClickSwap })

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
        case TransactionStepType.SwapTransactionBatched: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionBatchedStep, {
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

function useGetActiveAccount() {
  const evmAccount = useActiveAccount(Platform.EVM)
  const svmAccount = useActiveAccount(Platform.SVM)

  return useEvent((chainId: UniverseChainId) => {
    const platformMap = { [Platform.EVM]: evmAccount, [Platform.SVM]: svmAccount }
    const platform = resolvePlatform(chainId)
    return platformMap[platform]
  })
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga({ saga: swap, name: 'swapSaga', options: { timeoutDuration: ms('30m') } })

/** Callback to submit trades and track progress */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const selectChain = useSelectChain()
  const trace = useTrace()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  const getOnPressRetry = useGetOnPressRetry()

  const getActiveAccount = useGetActiveAccount()

  const caip25Info = useAccountsStore((state) => {
    return state.getActiveConnector(Platform.EVM)?.session?.caip25Info
  })

  return useCallback(
    (args: SwapCallbackParams) => {
      const {
        swapTxContext,
        onSuccess,
        onFailure,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        presetPercentage,
        preselectAsset,
        isAutoSlippage,
        isFiatInputMode,
        setCurrentStep,
        setSteps,
        onPending,
        onClearForm,
      } = args
      const { trade, gasFee } = swapTxContext

      const isClassicSwap = isClassic(swapTxContext)
      const isBatched = isClassicSwap && swapTxContext.txRequests && swapTxContext.txRequests.length > 1
      const includedPermitTransactionStep = isClassicSwap && swapTxContext.permit?.method === PermitMethod.Transaction

      const analytics = getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        presetPercentage,
        preselectAsset,
        portfolioBalanceUsd,
        trace,
        isBatched,
        includedPermitTransactionStep,
        swapStartTimestamp,
      })

      const account = getActiveAccount(trade.inputAmount.currency.chainId)

      if (!account) {
        throw new Error('No account found')
      }

      const swapParams = {
        swapTxContext,
        caip25Info,
        address: account.address,
        analytics,
        getOnPressRetry,
        disableOneClickSwap,
        onClearForm,
        onSuccess,
        onFailure,
        setCurrentStep,
        setSteps,
        selectChain,
        startChainId: account.chainId,
        onPending,
        onTransactionHash: (hash: string): void => {
          updateSwapForm({ txHash: hash, txHashReceivedTime: Date.now() })
        },
        swapStartTimestamp,
      }
      if (swapTxContext.trade.routing === TradingApi.Routing.CHAINED) {
        const handleSwapTransactionBatchedStep = createHandleSwapTransactionBatchedStep({
          disableOneClickSwap,
          waitForTxHash: true,
        })

        appDispatch(
          planActions.trigger({
            ...swapParams,
            address: account.address,
            handleApprovalTransactionStep,
            handleSwapTransactionStep,
            handleSwapTransactionBatchedStep,
            handleSignatureStep,
            handleUniswapXPlanSignatureStep,
            getDisplayableError: (args) => getDisplayableError({ ...args, isPlanStep: true }),
            getOnPressRetry,
            sendToast,
          }),
        )
      } else {
        appDispatch(swapActions.trigger(swapParams))
      }

      const blockNumber = getClassicQuoteFromResponse(trade.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SwapSubmittedButtonClicked, {
        ...analytics,
        estimated_network_fee_wei: gasFee.value,
        gas_limit: isClassicSwap ? swapTxContext.txRequests?.[0]?.gasLimit?.toString() : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp ? Date.now() - swapStartTimestamp : undefined,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    },
    [
      formatter,
      portfolioBalanceUsd,
      trace,
      selectChain,
      getActiveAccount,
      appDispatch,
      swapStartTimestamp,
      getOnPressRetry,
      disableOneClickSwap,
      updateSwapForm,
      caip25Info,
    ],
  )
}
