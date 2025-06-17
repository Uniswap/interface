import { useEffect } from 'react'
import { UseInputFocusSyncProps } from 'uniswap/src/components/CurrencyInputPanel/hooks/useInputFocusSync/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// For native mobile, given that we're using a custom `DecimalPad`,
// the input's focus state can sometimes be out of sync with the controlled `focus` prop.
// When this happens, we want to sync the input's focus state by either auto-focusing or blurring it.
export function useInputFocusSync({
  inputRef,
  focus,
  value,
  currencyField,
  resetSelection,
}: UseInputFocusSyncProps): void {
  const isTextInputRefActuallyFocused = inputRef.current?.isFocused()
  useEffect(() => {
    if (focus === undefined) {
      // Ignore this effect unless `focus` is explicitly set to a boolean.
      return
    }

    if (focus && !isTextInputRefActuallyFocused) {
      resetSelection?.({
        start: value?.length ?? 0,
        end: value?.length ?? 0,
        currencyField,
      })
      setTimeout(() => {
        // We need to wait for the token selector sheet to fully close before triggering this or else it won't work.
        inputRef.current?.focus()
      }, ONE_SECOND_MS / 2)
    } else if (!focus && isTextInputRefActuallyFocused) {
      inputRef.current?.blur()
    }
  }, [inputRef, currencyField, focus, isTextInputRefActuallyFocused, resetSelection, value?.length])
}
