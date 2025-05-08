import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { isInterface } from 'utilities/src/platform'

export function useSwapOnPrevious(): {
  onPrev: () => void
} {
  const dispatch = useDispatch()
  const { exactCurrencyField: ctxExactCurrencyField, focusOnCurrencyField, updateSwapForm } = useSwapFormContext()
  const { setScreen } = useTransactionModalContext()

  const onPrev = useCallback(() => {
    if (!focusOnCurrencyField) {
      // We make sure that one of the input fields is focused (and the `DecimalPad` open) when the user goes back.
      updateSwapForm({ focusOnCurrencyField: ctxExactCurrencyField })
    }
    // On interface, closing the review modal should cancel the transaction flow saga and remove submitting UI.
    if (isInterface) {
      updateSwapForm({ isSubmitting: false })
      dispatch(interruptTransactionFlow())
    }

    setScreen(TransactionScreen.Form)
  }, [ctxExactCurrencyField, focusOnCurrencyField, setScreen, updateSwapForm, dispatch])

  return {
    onPrev,
  }
}
