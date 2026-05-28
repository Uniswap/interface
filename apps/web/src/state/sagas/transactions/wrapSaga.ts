import { isFewToken } from '@ring-protocol/few-v2-sdk'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { INTERNAL_JSON_RPC_ERROR_CODE } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  HandleOnChainStepParams,
  handleApprovalTransactionStep,
  handleOnChainStep,
} from 'state/sagas/transactions/utils'
import { TransactionType, WrapTransactionInfo } from 'state/transactions/types'
import { call } from 'typed-redux-saga'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { generateWrapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateWrapTransactionSteps'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import noop from 'utilities/src/react/noop'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

interface HandleWrapStepParams extends Omit<HandleOnChainStepParams<WrapTransactionStep>, 'info'> {}
function* handleWrapStep(params: HandleWrapStepParams) {
  if (params.step.inputCurrencyId && params.step.outputCurrencyId) {
    const info = getFewWrapTransactionInfo(
      params.step.amount,
      params.step.inputCurrencyId,
      params.step.outputCurrencyId,
    )
    return yield* call(handleOnChainStep, { ...params, info })
  }
  const info = getWrapTransactionInfo(params.step.amount)
  return yield* call(handleOnChainStep, { ...params, info })
}

type WrapParams = WrapCallbackParams & { selectChain: (chainId: number) => Promise<boolean>; startChainId?: number }

function* wrap(params: WrapParams) {
  try {
    const {
      account,
      inputCurrencyAmount,
      selectChain,
      txRequest,
      startChainId,
      onFailure,
      inputCurrencyId,
      outputCurrencyId,
    } = params

    // Switch chains if needed
    if (txRequest.chainId !== startChainId) {
      const chainSwitched = yield* call(selectChain, txRequest.chainId)
      if (!chainSwitched) {
        onFailure()
        return
      }
    }

    if (inputCurrencyId && outputCurrencyId) {
      yield* handleFewLogic(params)
      return
    }

    const step = { type: TransactionStepType.WrapTransaction, txRequest, amount: inputCurrencyAmount } as const

    const hash = yield* call(handleWrapStep, {
      step,
      account,
      setCurrentStep: noop,
      shouldWaitForConfirmation: false,
      allowDuplicativeTx: true, // Compared to UniswapX wraps, the user should not be stopped from wrapping in quick succession
    })

    popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)

    params.onSuccess()
  } catch (error) {
    if (didUserReject(error)) {
      params.onFailure()
      return
    }

    if (!(isTestnetChain(params.txRequest.chainId) && error.code === INTERNAL_JSON_RPC_ERROR_CODE)) {
      logger.error(error, {
        tags: {
          file: 'wrapSaga',
          function: 'wrap',
          chainId: params.txRequest.chainId,
        },
      })
    }
    params.onFailure()
  }
}

function getWrapTransactionInfo(amount: CurrencyAmount<Currency>): WrapTransactionInfo {
  return amount.currency.isNative
    ? {
        type: TransactionType.WRAP,
        unwrapped: false,
        currencyAmountRaw: amount.quotient.toString(),
      }
    : {
        type: TransactionType.WRAP,
        unwrapped: true,
        currencyAmountRaw: amount.quotient.toString(),
      }
}

function* handleFewLogic(params: WrapParams) {
  const { account, inputCurrencyAmount, swapTxContext, setSteps, setCurrentStep, inputCurrencyId, outputCurrencyId } =
    params

  // Generate steps (including approval if needed)
  let steps: TransactionStep[] = []
  if (!swapTxContext) {
    throw new Error('swapTxContext is required')
  }
  steps = generateWrapTransactionSteps(swapTxContext, inputCurrencyAmount, inputCurrencyId, outputCurrencyId)

  // Set steps for UI progress display
  if (setSteps) {
    setSteps(steps)
  }
  // Create a wrapper for setCurrentStep that matches the expected signature
  const wrappedSetCurrentStep = setCurrentStep
    ? (args: { step: TransactionStep; accepted: boolean }) => {
        // Call the original setCurrentStep which only expects the step
        setCurrentStep(args.step)
      }
    : noop

  // Execute steps in order
  for (const step of steps) {
    if (setCurrentStep) {
      setCurrentStep(step)
    }

    switch (step.type) {
      case TransactionStepType.TokenRevocationTransaction:
      case TransactionStepType.TokenApprovalTransaction: {
        yield* handleApprovalTransactionStep({
          step,
          account,
          setCurrentStep: wrappedSetCurrentStep,
        })
        break
      }
      case TransactionStepType.WrapTransaction: {
        const hash = yield* handleWrapStep({
          step,
          account,
          setCurrentStep: wrappedSetCurrentStep,
          shouldWaitForConfirmation: false,
          allowDuplicativeTx: true, // Compared to UniswapX wraps, the user should not be stopped from wrapping in quick succession
        })

        popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
        params.onSuccess()
        break
      }
      default:
        throw new Error(`Unexpected step type in wrap: ${(step as any).type}`)
    }
  }
}

//Ring wrap
function getFewWrapTransactionInfo(
  amount: CurrencyAmount<Currency>,
  inputCurrencyId?: string,
  outputCurrencyId?: string,
): WrapTransactionInfo {
  const chainId = amount.currency.chainId
  const isNative = amount.currency.isNative
  const inputCurrency = amount.currency
  const inputToken = isNative ? inputCurrency.wrapped : (inputCurrency as Token)
  const wrappedNative = nativeOnChain(chainId).wrapped

  // Helper to check if it's WETH
  const isWETH = !isNative && wrappedNative.equals(inputToken)

  const isInputFewToken = isFewToken(inputToken)

  // 1. FewToken -> Original (FewUnwrap)
  if (isInputFewToken) {
    return {
      type: TransactionType.WRAP,
      unwrapped: true,
      currencyAmountRaw: amount.quotient.toString(),
      chainId,
      inputCurrencyId,
      outputCurrencyId,
    }
  }

  // 2. Native -> WETH (Wrap)
  if (isNative) {
    return {
      type: TransactionType.WRAP,
      unwrapped: false,
      currencyAmountRaw: amount.quotient.toString(),
      chainId,
      inputCurrencyId: inputCurrencyId ?? currencyId(inputCurrency),
      outputCurrencyId: outputCurrencyId ?? currencyId(wrappedNative),
    }
  }

  // 3. WETH -> Native (Unwrap)
  if (isWETH) {
    return {
      type: TransactionType.WRAP,
      unwrapped: true,
      currencyAmountRaw: amount.quotient.toString(),
      chainId,
      inputCurrencyId: inputCurrencyId ?? currencyId(inputCurrency),
      outputCurrencyId: outputCurrencyId ?? currencyId(nativeOnChain(chainId)),
    }
  }

  // 4. Original -> FewToken (FewWrap)
  return {
    type: TransactionType.WRAP,
    unwrapped: false,
    currencyAmountRaw: amount.quotient.toString(),
    chainId,
    inputCurrencyId,
    outputCurrencyId,
  }
}

export const wrapSaga = createSaga(wrap, 'wrap')

export function useWrapCallback(): WrapCallback {
  const appDispatch = useDispatch()
  const selectChain = useSelectChain()
  const startChainId = useAccount().chainId

  return useCallback(
    (params: WrapCallbackParams) => {
      appDispatch(wrapSaga.actions.trigger({ ...params, selectChain, startChainId }))
    },
    [appDispatch, selectChain, startChainId],
  )
}
