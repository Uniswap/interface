import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { INTERNAL_JSON_RPC_ERROR_CODE } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { handleOnChainStep } from 'state/sagas/transactions/utils'
import { call } from 'typed-redux-saga'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { HandleOnChainStepParams, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { TransactionType, WrapTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

interface HandleWrapStepParams extends Omit<HandleOnChainStepParams<WrapTransactionStep>, 'info'> {}
function* handleWrapStep(params: HandleWrapStepParams) {
  const info = getWrapTransactionInfo(params.step.amount)
  return yield* call(handleOnChainStep, { ...params, info })
}

type WrapParams = WrapCallbackParams & { selectChain: (chainId: number) => Promise<boolean>; startChainId?: number }

function* wrap(params: WrapParams) {
  try {
    const { account, inputCurrencyAmount, selectChain, txRequest, startChainId, onFailure } = params

    // Switch chains if needed
    if (txRequest.chainId !== startChainId) {
      const chainSwitched = yield* call(selectChain, txRequest.chainId)
      if (!chainSwitched) {
        onFailure()
        return
      }
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
        type: TransactionType.Wrap,
        unwrapped: false,
        currencyAmountRaw: amount.quotient.toString(),
      }
    : {
        type: TransactionType.Wrap,
        unwrapped: true,
        currencyAmountRaw: amount.quotient.toString(),
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
