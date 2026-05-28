import { useMemo } from 'react'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useSwapDependencies } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
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
    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequests?.[0]
    if (!wrapCallback || !txRequest || !isInterfaceWrap || !account || !inputCurrencyAmount) {
      return undefined
    }

    const onSuccess = (): void =>
      updateSwapForm({ exactAmountFiat: undefined, exactAmountToken: '', isSubmitting: false })
    const onFailure = (): void => updateSwapForm({ isSubmitting: false })

    const inputCurrency = derivedSwapInfo.currencies[CurrencyField.INPUT]?.currency
    const outputCurrency = derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency
    const is_few_wrap = wrapType === WrapType.FewWrap || wrapType === WrapType.FewUnwrap
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
        //ring
        swapTxContext, // Pass swapTxContext for step generation
        setCurrentStep: undefined, // No step tracking in interface wrap
        setSteps: undefined, // No step tracking in interface wrap
        inputCurrencyId: is_few_wrap ? (inputCurrency ? currencyId(inputCurrency) : undefined) : undefined,
        outputCurrencyId: is_few_wrap ? (outputCurrency ? currencyId(outputCurrency) : undefined) : undefined,
      })
    }
  }, [
    account,
    currencyAmounts,
    isInterfaceWrap,
    swapTxContext,
    txId,
    updateSwapForm,
    wrapCallback,
    wrapType,
    derivedSwapInfo.currencies,
  ])

  return { isInterfaceWrap, onInterfaceWrap }
}
