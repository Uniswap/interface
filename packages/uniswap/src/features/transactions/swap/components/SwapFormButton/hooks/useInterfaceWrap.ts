import { useMemo } from 'react'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isJupiter, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isWebApp } from 'utilities/src/platform'

// TODO(WEB-5012): Align interface wrap UX into SwapReviewScreen
export function useInterfaceWrap(): {
  isInterfaceWrap: boolean
  onInterfaceWrap?: () => void
} {
  // TODO(WALL-6391): remove direct usage and replace with SwapService
  const wrapCallback = useSwapDependenciesStore((state) => state.wrapCallback)
  const account = useWallet().evmAccount
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const { currencyAmounts, txId, wrapType } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencyAmounts: s.currencyAmounts,
    txId: s.txId,
    wrapType: s.wrapType,
  }))
  const { txRequest, gasFeeEstimation } = useSwapTxStore((s) => {
    if (isUniswapX(s) || isJupiter(s)) {
      return {
        txRequest: undefined,
        gasFeeEstimation: s.gasFeeEstimation,
      }
    }

    return {
      txRequest: s.txRequests?.[0],
      gasFeeEstimation: s.gasFeeEstimation,
    }
  })

  const isInterfaceWrap = isWebApp && wrapType !== WrapType.NotApplicable

  const onInterfaceWrap = useMemo(() => {
    const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
    if (!txRequest || !isInterfaceWrap || !account || !inputCurrencyAmount) {
      return undefined
    }

    const onSuccess = (): void =>
      updateSwapForm({ exactAmountFiat: undefined, exactAmountToken: '', isSubmitting: false })
    const onFailure = (): void => updateSwapForm({ isSubmitting: false })

    return () => {
      updateSwapForm({ isSubmitting: true })
      wrapCallback({
        account,
        inputCurrencyAmount,
        onSuccess,
        onFailure,
        txRequest,
        txId,
        wrapType,
        gasEstimate: gasFeeEstimation.wrapEstimate,
      })
    }
  }, [
    currencyAmounts,
    txRequest,
    isInterfaceWrap,
    account,
    updateSwapForm,
    wrapCallback,
    txId,
    wrapType,
    gasFeeEstimation.wrapEstimate,
  ])

  return { isInterfaceWrap, onInterfaceWrap }
}
