import { SwapEventName } from '@uniswap/analytics-events'
import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useSetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { handleAtomicSendCalls } from 'state/sagas/transactions/5792'
import { useGetOnPressRetry } from 'state/sagas/transactions/retry'
import { handleUniswapXSignatureStep } from 'state/sagas/transactions/uniswapx'
import {
  HandleOnChainStepParams,
  getDisplayableError,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handlePermitTransactionStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import { handleWrapStep } from 'state/sagas/transactions/wrapSaga'
import { VitalTxFields } from 'state/transactions/types'
import invariant from 'tiny-invariant'
import { call } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  SwapTransactionStepBatched,
} from 'uniswap/src/features/transactions/swap/steps/swap'
import {
  SetCurrentStepFn,
  SwapCallback,
  SwapCallbackParams,
} from 'uniswap/src/features/transactions/swap/types/swapCallback'
import {
  PermitMethod,
  ValidatedBridgeSwapTxAndGasInfo,
  ValidatedClassicSwapTxAndGasInfo,
  ValidatedSwapTxContext,
  ValidatedUniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface HandleSwapStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStep | SwapTransactionStepAsync
  signature?: string
  trade: ClassicTrade | BridgeTrade
  analytics: SwapTradeBaseProperties
}

interface HandleSwapStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStep | SwapTransactionStepAsync
  signature?: string
  trade: ClassicTrade | BridgeTrade
  analytics: SwapTradeBaseProperties
}
function* handleSwapTransactionStep(params: HandleSwapStepParams) {
  const { trade, step, signature, analytics } = params

  const info = getSwapTransactionInfo(trade)
  const txRequest = yield* call(getSwapTxRequest, step, signature)

  const onModification = ({ hash, data }: VitalTxFields) => {
    sendAnalyticsEvent(SwapEventName.SWAP_MODIFIED_IN_WALLET, {
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

  popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)

  return
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
  trade: ClassicTrade | BridgeTrade
  analytics: SwapTradeBaseProperties
  hash?: string
  batchId?: string
}) {
  const { trade, analytics, hash, batchId } = params

  sendAnalyticsEvent(
    SwapEventName.SWAP_SIGNED,
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
  account: SignerMnemonicAccountMeta
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSwapTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  getOnPressRetry: (error: Error | undefined) => (() => void) | undefined
  // TODO(WEB-7763): Upgrade jotai to v2 to avoid need for prop drilling `disableOneClickSwap`
  disableOneClickSwap: () => void
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  v4Enabled: boolean
}

// eslint-disable-next-line consistent-return
function* swap(params: SwapParams) {
  const { swapTxContext, setSteps, selectChain, startChainId, v4Enabled, onFailure } = params

  try {
    const steps = yield* call(generateSwapTransactionSteps, swapTxContext, v4Enabled)
    setSteps(steps)

    // Switch chains if needed
    const swapChainId = swapTxContext.trade.inputAmount.currency.chainId
    if (swapChainId !== startChainId) {
      const chainSwitched = yield* call(selectChain, swapChainId)
      if (!chainSwitched) {
        onFailure()
        return undefined
      }
    }

    switch (swapTxContext.routing) {
      case Routing.CLASSIC:
      case Routing.BRIDGE:
        return yield* classicSwap({ ...params, swapTxContext, steps })
      case Routing.DUTCH_V2:
      case Routing.DUTCH_V3:
      case Routing.PRIORITY:
        return yield* uniswapXSwap({ ...params, swapTxContext, steps })
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'swapSaga', function: 'swap' } })
    onFailure(error)
  }
}

function* classicSwap(
  params: SwapParams & {
    swapTxContext: ValidatedClassicSwapTxAndGasInfo | ValidatedBridgeSwapTxAndGasInfo
    steps: TransactionStep[]
  },
) {
  const {
    account,
    disableOneClickSwap,
    setCurrentStep,
    steps,
    swapTxContext: { trade },
    analytics,
    onSuccess,
    onFailure,
  } = params

  let signature: string | undefined

  for (const step of steps) {
    try {
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
          yield* call(handleSwapTransactionStep, { account, signature, step, setCurrentStep, trade, analytics })
          break
        }
        case TransactionStepType.SwapTransactionBatched: {
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
        default: {
          throw new UnexpectedTransactionStateError(`Unexpected step type: ${step.type}`)
        }
      }
    } catch (error) {
      const displayableError = getDisplayableError(error, step)
      if (displayableError) {
        logger.error(displayableError, { tags: { file: 'swapSaga', function: 'classicSwap' } })
      }
      const onPressRetry = params.getOnPressRetry(displayableError)
      onFailure(displayableError, onPressRetry)
      return
    }
  }

  yield* call(onSuccess)
}

function* uniswapXSwap(
  params: SwapParams & {
    swapTxContext: ValidatedUniswapXSwapTxAndGasInfo
    steps: TransactionStep[]
    analytics: SwapTradeBaseProperties
  },
) {
  const {
    account,
    setCurrentStep,
    steps,
    swapTxContext: { trade },
    analytics,
    onFailure,
    onSuccess,
  } = params

  for (const step of steps) {
    try {
      switch (step.type) {
        case TransactionStepType.WrapTransaction: {
          yield* call(handleWrapStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.TokenRevocationTransaction:
        case TransactionStepType.TokenApprovalTransaction: {
          yield* call(handleApprovalTransactionStep, { account, step, setCurrentStep })
          break
        }
        case TransactionStepType.UniswapXSignature: {
          yield* call(handleUniswapXSignatureStep, { account, step, setCurrentStep, trade, analytics })
          break
        }
        default: {
          throw new UnexpectedTransactionStateError(`Unexpected step type: ${step.type}`)
        }
      }
    } catch (error) {
      const displayableError = getDisplayableError(error, step)
      if (displayableError) {
        logger.error(displayableError, { tags: { file: 'swapSaga', function: 'uniswapXSwap' } })
      }
      onFailure(displayableError)
      return
    }
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

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  const getOnPressRetry = useGetOnPressRetry()

  return useCallback(
    (args: SwapCallbackParams) => {
      const {
        account,
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
      }
      appDispatch(swapSaga.actions.trigger(swapParams))

      const blockNumber = getClassicQuoteFromResponse(trade?.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
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
    ],
  )
}
