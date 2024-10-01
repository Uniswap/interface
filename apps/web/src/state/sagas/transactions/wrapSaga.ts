import { Web3Provider } from '@ethersproject/providers'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { PopupType, addPopup } from 'state/application/reducer'
import { HandleOnChainStepParams, handleOnChainStep } from 'state/sagas/transactions/utils'
import { TransactionType, WrapTransactionInfo } from 'state/transactions/types'
import { call, put } from 'typed-redux-saga'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import {
  TransactionStepType,
  WrapTransactionStep,
} from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import noop from 'utilities/src/react/noop'

interface HandleWrapStepParams extends Omit<HandleOnChainStepParams<WrapTransactionStep>, 'info'> {}
export function* handleWrapStep(params: HandleWrapStepParams) {
  const info = getWrapTransactionInfo(params.step.amount)
  return yield* call(handleOnChainStep, { ...params, info })
}

type WrapParams = WrapCallbackParams & { provider: Web3Provider }

function* wrap(params: WrapParams) {
  try {
    const { account, inputCurrencyAmount, txRequest, provider } = params

    const step = { type: TransactionStepType.WrapTransaction, txRequest, amount: inputCurrencyAmount } as const

    const hash = yield* call(handleWrapStep, {
      step,
      account,
      provider,
      setCurrentStep: noop,
      shouldWaitForConfirmation: false,
    })

    yield* put(addPopup({ content: { type: PopupType.Transaction, hash }, key: hash }))

    params.onSuccess()
  } catch (error) {
    logger.error(error, { tags: { file: 'wrapSaga', function: 'wrap' } })
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

export const wrapSaga = createSaga(wrap, 'wrap')

export function useWrapCallback(): WrapCallback {
  const appDispatch = useDispatch()
  const provider = useEthersWeb3Provider()

  return useCallback(
    (params: WrapCallbackParams) => {
      if (!provider) {
        throw new Error('Provider not found')
      }

      appDispatch(wrapSaga.actions.trigger({ ...params, provider }))
    },
    [appDispatch, provider],
  )
}
