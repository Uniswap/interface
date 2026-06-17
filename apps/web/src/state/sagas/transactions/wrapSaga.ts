import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { call } from 'typed-redux-saga'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { HandleOnChainStepParams, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { WrapTransactionStep, WrapTransactionStepWalletCall } from 'uniswap/src/features/transactions/steps/wrap'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { TransactionType, WrapTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createSaga } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { noop } from 'utilities/src/react/noop'
import { INTERNAL_JSON_RPC_ERROR_CODE } from '~/constants/misc'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { handleAtomicSendCalls } from '~/state/sagas/transactions/5792'
import { handleOnChainStep } from '~/state/sagas/transactions/utils'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

// oxlint-disable-next-line typescript/no-empty-interface -- biome-parity: oxlint is stricter here
interface HandleWrapStepParams extends Omit<HandleOnChainStepParams<WrapTransactionStep>, 'info'> {}
function* handleWrapStep(params: HandleWrapStepParams) {
  const info = getWrapTransactionInfo(params.step.amount)
  return yield* call(handleOnChainStep, { ...params, info })
}

interface HandleWrapWalletCallStepParams extends Omit<HandleOnChainStepParams, 'info' | 'step'> {
  step: WrapTransactionStepWalletCall
}
function* handleWrapWalletCallStep(params: HandleWrapWalletCallStepParams) {
  const info = getWrapTransactionInfo(params.step.amount)
  return yield* call(handleAtomicSendCalls, { ...params, info })
}

type WrapParams = WrapCallbackParams & { selectChain: (chainId: number) => Promise<boolean>; startChainId?: number }

function* wrap(params: WrapParams) {
  // The first call in the wallet-call branch needs `chainId`, so resolve it from the step shape.
  const chainId =
    params.step.type === TransactionStepType.WrapTransactionWalletCall
      ? params.step.walletCallTxRequests[0].chainId
      : params.step.txRequest.chainId

  try {
    const { address, selectChain, startChainId, step, onFailure } = params

    // Switch chains if needed
    if (chainId !== startChainId) {
      const chainSwitched = yield* call(selectChain, chainId)
      if (!chainSwitched) {
        onFailure()
        return
      }
    }

    let hash: string
    if (step.type === TransactionStepType.WrapTransactionWalletCall) {
      // Sponsored / atomic-batched path: submit via wallet_sendCalls + paymaster capability.
      hash = yield* call(handleWrapWalletCallStep, {
        step,
        address,
        setCurrentStep: noop,
        shouldWaitForConfirmation: false,
        ignoreInterrupt: true,
      })
    } else {
      hash = yield* call(handleWrapStep, {
        step,
        address,
        setCurrentStep: noop,
        shouldWaitForConfirmation: false,
        allowDuplicativeTx: true, // Compared to UniswapX wraps, the user should not be stopped from wrapping in quick succession
      })
    }

    // handleAtomicSendCalls already registers a popup for the batchId; only register on the legacy path.
    if (step.type === TransactionStepType.WrapTransaction) {
      popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash)
    }

    params.onSuccess()
  } catch (error) {
    if (didUserReject(error)) {
      params.onFailure()
      return
    }

    if (!(isTestnetChain(chainId) && error.code === INTERNAL_JSON_RPC_ERROR_CODE)) {
      logger.error(error, {
        tags: {
          file: 'wrapSaga',
          function: 'wrap',
          chainId,
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
