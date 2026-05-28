import type { RefObject } from 'react'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

export const useOnToggleIsFiatMode = ({
  formattedDerivedValueRef,
  moveCursorToEnd,
}: {
  formattedDerivedValueRef: RefObject<string>
  moveCursorToEnd: ({ targetInputRef }: { targetInputRef: RefObject<string> }) => void
}): ((currencyField: CurrencyField) => void) => {
  const {
    exactAmountFiatRef,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    isFiatMode,
    updateSwapForm,
  } = useSwapFormStore((s) => ({
    exactAmountFiatRef: s.exactAmountFiatRef,
    exactAmountTokenRef: s.exactAmountTokenRef,
    exactCurrencyField: s.exactCurrencyField,
    focusOnCurrencyField: s.focusOnCurrencyField,
    isFiatMode: s.isFiatMode,
    updateSwapForm: s.updateSwapForm,
  }))

  return useEvent((currencyField: CurrencyField): void => {
    const newIsFiatMode = !isFiatMode
    let targetInputRef: RefObject<string> | undefined

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
      moveCursorToEnd({ targetInputRef })
    }, 0)
  })
}
