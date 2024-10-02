/* eslint-disable rulesdir/no-undefined-or */
import { TransactionResponse } from '@ethersproject/providers'
import { SwapEventName } from '@uniswap/analytics-events'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PopupType, addPopup } from 'state/application/reducer'
import { handleUniswapXSignatureStep } from 'state/sagas/transactions/uniswapx'
import {
  HandleOnChainStepParams,
  getSwapTransactionInfo,
  handleApprovalTransactionStep,
  handleOnChainStep,
  handleSignatureStep,
} from 'state/sagas/transactions/utils'
import { handleWrapStep } from 'state/sagas/transactions/wrapSaga'
import invariant from 'tiny-invariant'
import { call, put } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { selectSwapStartTimestamp } from 'uniswap/src/features/timing/selectors'
import { updateSwapStartTimestamp } from 'uniswap/src/features/timing/slice'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import {
  SetCurrentStepFn,
  SwapCallback,
  SwapCallbackParams,
} from 'uniswap/src/features/transactions/swap/types/swapCallback'
import {
  ValidatedClassicSwapTxAndGasInfo,
  ValidatedSwapTxContext,
  ValidatedUniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  SwapTransactionStep,
  SwapTransactionStepAsync,
  TransactionStep,
  TransactionStepType,
  generateTransactionSteps,
} from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getClassicQuoteFromResponse } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { createSaga } from 'uniswap/src/utils/saga'
import { percentFromFloat } from 'utilities/src/format/percent'
import { logger } from 'utilities/src/logger/logger'

// TODO(WEB-4921): Move errors to uniswap package and handle them in UI
class UnexpectedSwapStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedSwapStateError'
  }
}

interface HandleSwapStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStep | SwapTransactionStepAsync
  signature: string | undefined
  trade: ClassicTrade
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
}
function* handleSwapTransactionStep(params: HandleSwapStepParams) {
  const { trade, step, signature, analytics } = params
  const info = getSwapTransactionInfo(trade)
  const txRequest = yield* call(getSwapTxRequest, step, signature)

  const onModification = (response: TransactionResponse) => {
    sendAnalyticsEvent(SwapEventName.SWAP_MODIFIED_IN_WALLET, {
      txHash: response.hash,
      expected: txRequest.data?.toString() ?? '',
      actual: response.data,
    })
  }

  // Now that we have the txRequest, we can create a definitive SwapTransactionStep, incase we started with an async step.
  const onChainStep = { ...step, txRequest }
  const hash = yield* call(handleOnChainStep, { ...params, info, step: onChainStep, onModification })

  sendAnalyticsEvent(
    SwapEventName.SWAP_SIGNED,
    formatSwapSignedAnalyticsEventProperties({
      trade,
      allowedSlippage: percentFromFloat(trade.slippageTolerance),
      fiatValues: {
        amountIn: analytics.token_in_amount_usd,
        amountOut: analytics.token_out_amount_usd,
        feeUsd: analytics.fee_usd,
      },
      txHash: hash,
      portfolioBalanceUsd: analytics.total_balances_usd,
    }),
  )

  yield* put(addPopup({ content: { type: PopupType.Transaction, hash }, key: hash }))

  return
}

function* getSwapTxRequest(step: SwapTransactionStep | SwapTransactionStepAsync, signature: string | undefined) {
  if (step.type === TransactionStepType.SwapTransaction) {
    return step.txRequest
  }

  if (!signature) {
    throw new UnexpectedSwapStateError('Signature required for async swap transaction step')
  }

  try {
    const txRequest = yield* call(step.getTxRequest, signature)
    invariant(txRequest !== undefined)

    return txRequest
  } catch {
    throw new UnexpectedSwapStateError('Failed to get transaction request')
  }
}

type SwapParams = {
  selectChain: (chainId: number) => Promise<boolean>
  startChainId?: number
  account: SignerMnemonicAccountMeta
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  swapTxContext: ValidatedSwapTxContext
  setCurrentStep: SetCurrentStepFn
  setSteps: (steps: TransactionStep[]) => void
  onSuccess: () => void
  onFailure: () => void
}

// eslint-disable-next-line consistent-return
function* swap(params: SwapParams) {
  const { analytics, swapTxContext, selectChain, startChainId, onFailure } = params
  const steps = yield* call(generateTransactionSteps, swapTxContext)
  params.setSteps(steps)

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
      return yield* classicSwap({
        ...params,
        swapTxContext,
        steps,
        analytics,
      })
    case Routing.DUTCH_V2:
      return yield* uniswapXSwap({ ...params, swapTxContext, steps })
    // case Routing.BRIDGE:
    //   return yield* bridgingSaga({ ...params, swapTxContext })
  }
}

function* classicSwap(
  params: SwapParams & { swapTxContext: ValidatedClassicSwapTxAndGasInfo; steps: TransactionStep[] },
) {
  const {
    account,
    setCurrentStep,
    steps,
    swapTxContext: { trade },
    analytics,
  } = params

  let signature: string | undefined

  try {
    for (const step of steps) {
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
        case TransactionStepType.SwapTransaction:
        case TransactionStepType.SwapTransactionAsync: {
          yield* call(handleSwapTransactionStep, { account, signature, step, setCurrentStep, trade, analytics })
          break
        }
        default: {
          throw new UnexpectedSwapStateError('Unexpected step type')
        }
      }
    }
  } catch (e) {
    // TODO(WEB-4921): pass errors to onFailure and to handle in UI
    logger.error(e, { tags: { file: 'swapSaga', function: 'classicSwap' } })
  }

  yield* call(params.onSuccess)
}

function* uniswapXSwap(
  params: SwapParams & {
    swapTxContext: ValidatedUniswapXSwapTxAndGasInfo
    steps: TransactionStep[]
    analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  },
) {
  const {
    account,
    setCurrentStep,
    steps,
    swapTxContext: { trade },
    analytics,
  } = params

  try {
    for (const step of steps) {
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
          throw new UnexpectedSwapStateError('Unexpected step type')
        }
      }
    }
  } catch (e) {
    // TODO(WEB-4921): pass errors to onFailure and to handle in UI
    logger.error(e, { tags: { file: 'swapSaga', function: 'uniswapXSwap' } })
  }

  yield* call(params.onSuccess)
}

export const swapSaga = createSaga(swap, 'swapSaga')

/** Callback to submit trades and track progress */
export function useSwapCallback(): SwapCallback {
  const appDispatch = useDispatch()
  const formatter = useLocalizationContext()
  const swapStartTimestamp = useSelector(selectSwapStartTimestamp)
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId

  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()

  return useCallback(
    (args: SwapCallbackParams) => {
      const {
        account,
        swapTxContext,
        onSuccess,
        onFailure,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        isAutoSlippage,
        isFiatInputMode,
        setCurrentStep,
        setSteps,
      } = args
      const { trade, gasFee } = swapTxContext

      const analytics = getBaseTradeAnalyticsProperties({
        formatter,
        trade,
        currencyInAmountUSD,
        currencyOutAmountUSD,
        portfolioBalanceUsd,
      })
      const swapParams = {
        swapTxContext,
        account,
        analytics,
        onSuccess,
        onFailure,
        setCurrentStep,
        setSteps,
        selectChain,
        startChainId,
      }
      appDispatch(swapSaga.actions.trigger(swapParams))

      const blockNumber = getClassicQuoteFromResponse(trade?.quote)?.blockNumber?.toString()

      sendAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, {
        ...analytics,
        estimated_network_fee_wei: gasFee.value,
        gas_limit: isClassic(swapTxContext) ? swapTxContext.txRequest?.gasLimit?.toString() : undefined,
        transaction_deadline_seconds: trade.deadline,
        swap_quote_block_number: blockNumber,
        is_auto_slippage: isAutoSlippage,
        swap_flow_duration_milliseconds: swapStartTimestamp ? Date.now() - swapStartTimestamp : undefined,
        is_fiat_input_mode: isFiatInputMode,
      })

      // Reset swap start timestamp now that the swap has been submitted
      appDispatch(updateSwapStartTimestamp({ timestamp: undefined }))
    },
    [formatter, portfolioBalanceUsd, selectChain, startChainId, appDispatch, swapStartTimestamp],
  )
}
