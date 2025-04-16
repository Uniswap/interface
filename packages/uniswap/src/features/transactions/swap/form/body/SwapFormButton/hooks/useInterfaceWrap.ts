import { useMemo } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useSwapDependencies } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isInterface } from 'utilities/src/platform'

// TODO(WEB-5012): Align interface wrap UX into SwapReviewScreen
export function useInterfaceWrap(): {
  isInterfaceWrap: boolean
  onInterfaceWrap?: () => void
} {
  // TODO(WALL-6391): remove direct usage and replace with SwapService
  const { wrapCallback } = useSwapDependencies()
  const account = useAccountMeta()
  const { derivedSwapInfo, updateSwapForm } = useSwapFormContext()
  const swapTxContext = useSwapTxContext()

  const { currencyAmounts, txId, wrapType } = derivedSwapInfo
  const isInterfaceWrap = isInterface && wrapType !== WrapType.NotApplicable

  const onInterfaceWrap = useMemo(() => {
    const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequest
    if (!wrapCallback || !txRequest || !isInterfaceWrap || !account || !inputCurrencyAmount) {
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
        gasEstimates: swapTxContext.gasFeeEstimation.wrapEstimates,
      })
    }
  }, [account, currencyAmounts, isInterfaceWrap, swapTxContext, txId, updateSwapForm, wrapCallback, wrapType])

  return { isInterfaceWrap, onInterfaceWrap }
}
