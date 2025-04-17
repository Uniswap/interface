import type { MutableRefObject } from 'react'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

export const useOnToggleIsFiatMode = ({
  formattedDerivedValueRef,
  moveCursorToEnd,
}: {
  formattedDerivedValueRef: MutableRefObject<string>
  moveCursorToEnd: ({ targetInputRef }: { targetInputRef: MutableRefObject<string> }) => void
}): ((currencyField: CurrencyField) => void) => {
  const {
    exactAmountFiatRef,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    isFiatMode,
    updateSwapForm,
  } = useSwapFormContext()

  return useEvent((currencyField: CurrencyField): void => {
    const newIsFiatMode = !isFiatMode
    let targetInputRef: MutableRefObject<string> | undefined

    if (currencyField !== focusOnCurrencyField) {
      // Case 1: Clicking fiat toggle on a derived (non-exact) field should only focus that field
      // without changing fiat mode
      updateSwapForm({
        focusOnCurrencyField: currencyField,
      })
      targetInputRef = formattedDerivedValueRef
    } else if (currencyField !== exactCurrencyField) {
      // Case 2: Field is focused but not exact:
      // - Make it the exact field
      // - Copy the value from derived input
      // - Enable fiat mode (it must have been off)
      // Note: When fiat mode is already active, this keeps it on and toggles the exact field
      updateSwapForm({
        exactCurrencyField: currencyField,
        // next two lines are needed, so useSyncFiatAndTokenAmountUpdater works correctly
        exactAmountToken: formattedDerivedValueRef.current,
        exactAmountFiat: undefined,
        isFiatMode: true, // we can only be here if isFiatMode was false before as fiat mode can be triggered only on exact field
      })
      targetInputRef = exactAmountFiatRef
    } else {
      // Case 3: Standard fiat mode toggle for the exact field
      updateSwapForm({
        isFiatMode: newIsFiatMode,
      })
      targetInputRef = newIsFiatMode ? exactAmountFiatRef : exactAmountTokenRef
    }
    // We want this update to happen on the next tick, after the input value is updated.
    setTimeout(() => {
      if (targetInputRef) {
        moveCursorToEnd({ targetInputRef })
      }
    }, 0)
  })
}
