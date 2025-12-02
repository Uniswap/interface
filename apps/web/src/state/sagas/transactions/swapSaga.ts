import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { TradingApi } from '@universe/api'
import { Experiments } from '@universe/gating'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS, ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useSetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { handleAtomicSendCalls } from 'state/sagas/transactions/5792'
import { useGetOnPressRetry } from 'state/sagas/transactions/retry'
import { jupiterSwap } from 'state/sagas/transactions/solana'
import { handleUniswapXSignatureStep } from 'state/sagas/transactions/uniswapx'
import {
  getDisplayableError,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import { VitalTxFields } from 'state/transactions/types'
import invariant from 'tiny-invariant'
import { call, SagaGenerator } from 'typed-redux-saga'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { logExperimentQualifyingEvent } from 'uniswap/src/features/telemetry/utils/logExperimentQualifyingEvent'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import {
  HandleOnChainStepParams,
  HandleSwapStepParams,
  TransactionStep,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import {
  ExtractedBaseTradeAnalyticsProperties,
  getBaseTradeAnalyticsProperties,
} from 'uniswap/src/features/transactions/swap/analytics'
import { getFlashblocksExperimentStatus } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { planSaga } from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { handleSwitchChains } from 'uniswap/src/features/transactions/swap/plan/utils'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  SwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import {
  SetCurrentStepFn,
  SwapCallback,
  SwapCallbackParams,
} from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { PermitMethod, ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ChainedActionTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import {
  isClassic,
  isJupiter,
  requireRouting,
  UNISWAPX_ROUTING_VARIANTS,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import {
  isSignerMnemonicAccountDetails,
  SignerMnemonicAccountDetails,
} from 'uniswap/src/features/wallet/types/AccountDetails'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

function* handleSwapTransactionStep(params: HandleSwapStepParams): SagaGenerator<string> {
  const { trade, step, signature, analytics, onTransactionHash } = params

  const info = getSwapTransactionInfo(trade)
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
  if (!shouldShowModal) {
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

interface HandleSwapBatchedStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStepBatched
  trade: ClassicTrade | BridgeTrade
  analytics: SwapTradeBaseProperties
  disableOneClickSwap: () => void
}
function* handleSwapTransactionBatchedStep(params: HandleSwapBatchedStepParams) {
  const { trade, step, disableOneClickSwap } = params

  const info = getSwapTransactionInfo(trade)

  const batchId = yield* handleAtomicSendCalls({
    ...params,
    info,
    step,
    ignoreInterrupt: true, // We avoid interruption during the swap step, since it is too late to give user a new trade once the swap is submitted.
    shouldWaitForConfirmation: false,
    disableOneClickSwap,
  })
  handleSwapTransactionAnalytics({ ...params, batchId })

  popupRegistry.addPopup({ type: PopupType.Transaction, hash: batchId }, batchId)

  return
}

function handleSwapTransactionAnalytics(params: {
  trade: ClassicTrade | BridgeTrade | ChainedActionTrade
  analytics: SwapTradeBaseProperties
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
    }),
  )
}

function* getSwapTxRequest(step: SwapTransactionStep | SwapTransactionStepAsync, signature: string | undefined) {
  if (step.type === TransactionStepType.SwapTransaction) {
    return step.txRequest
  }

  if (!signature) {
    throw new UnexpectedTransactionStateError('Signature required for async swap transaction step')
  }

  const txRequest = yield* call(step.getTxRequest, signature)
  invariant(txRequest !== undefined)

  return txRequest
}

type SwapParams = {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountDetails
  analytics: ExtractedBaseTradeAnalyticsProperties
  swapTxContext: ValidatedSwapTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  getOnPressRetry: (error: Error | undefined) => (() => void) | undefined
  // TODO(WEB-7763): Upgrade jotai to v2 to avoid need for prop drilling `disableOneClickSwap`
  disableOneClickSwap: () => void
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  onTransactionHash?: (hash: string) => void
  v4Enabled: boolean
}

function* swap(params: SwapParams) {
  const {
    account,
    disableOneClickSwap,
    setCurrentStep,
    swapTxContext,
    analytics,
    onSuccess,
    onFailure,
    v4Enabled,
    setSteps,
  } = params
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

  const steps = yield* call(generateSwapTransactionSteps, swapTxContext, v4Enabled)
  setSteps(steps)

  let signature: string | undefined
  let step: TransactionStep | undefined

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
          yield* call(handleApprovalTransactionStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Signature: {
          signature = yield* call(handleSignatureStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.Permit2Transaction: {
          yield* call(handlePermitTransactionStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.SwapTransaction:
        case TransactionStepType.SwapTransactionAsync: {
          requireRouting(trade, [TradingApi.Routing.CLASSIC, TradingApi.Routing.BRIDGE])
          yield* call(handleSwapTransactionStep, {
            account,
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
            account,
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
          yield* call(handleUniswapXSignatureStep, { account, step, setCurrentStep, trade, analytics })
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

export const swapSaga = createSaga(swap, 'swapSaga')

/** Callback to submit trades and track progress */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const selectChain = useSelectChain()
  const connectedAccount = useAccount()
  const startChainId = connectedAccount.chainId
  const v4SwapEnabled = useV4SwapEnabled(startChainId)
  const trace = useTrace()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  const getOnPressRetry = useGetOnPressRetry()
  const wallet = useWallet()

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
      })

      const account = isSVMChain(trade.inputAmount.currency.chainId) ? wallet.svmAccount : wallet.evmAccount

      if (!account || !isSignerMnemonicAccountDetails(account)) {
        throw new Error('No account found')
      }

      const swapParams = {
        swapTxContext,
        account,
        analytics,
        getOnPressRetry,
        disableOneClickSwap,
        onSuccess,
        onFailure,
        setCurrentStep,
        setSteps,
        selectChain,
        startChainId,
        v4Enabled: v4SwapEnabled,
        onTransactionHash: (hash: string): void => {
          updateSwapForm({ txHash: hash, txHashReceivedTime: Date.now() })
        },
      }
      if (swapTxContext.trade.routing === TradingApi.Routing.CHAINED) {
        appDispatch(
          planSaga.actions.trigger({
            ...swapParams,
            handleApprovalTransactionStep,
            handleSwapTransactionStep,
            handleSignatureStep,
            getDisplayableError,
          }),
        )
      } else {
        appDispatch(swapSaga.actions.trigger(swapParams))
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
      startChainId,
      v4SwapEnabled,
      appDispatch,
      swapStartTimestamp,
      getOnPressRetry,
      disableOneClickSwap,
      wallet.evmAccount,
      wallet.svmAccount,
      updateSwapForm,
    ],
  )
}
