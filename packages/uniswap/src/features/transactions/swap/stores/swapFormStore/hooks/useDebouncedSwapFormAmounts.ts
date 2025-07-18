import type { CurrencyField } from 'uniswap/src/types/currency'
import { usePrevious } from 'utilities/src/react/hooks'
import { useDebounceWithStatus } from 'utilities/src/time/timing'

const SWAP_FORM_DEBOUNCE_TIME_MS = 250

export const useDebouncedSwapFormAmounts = ({
  exactCurrencyField,
  exactAmountToken,
  exactAmountFiat,
}: {
  exactCurrencyField: CurrencyField
  exactAmountToken: string | undefined
  exactAmountFiat: string | undefined
}): {
  debouncedExactAmountToken: string
  isDebouncingExactAmountToken: boolean
  debouncedExactAmountFiat: string
  isDebouncingExactAmountFiat: boolean
} => {
  const previousExactCurrencyField = usePrevious(exactCurrencyField)

  // If the exact currency field is changed, the amount may have changed as well
  // so we'll skip debouncing in this case
  const hasExactCurrencyFieldChanged = previousExactCurrencyField !== exactCurrencyField

  const [debouncedExactAmountToken, isDebouncingExactAmountToken] = useDebounceWithStatus({
    value: exactAmountToken,
    delay: SWAP_FORM_DEBOUNCE_TIME_MS,
    skipDebounce: hasExactCurrencyFieldChanged,
  })

  const [debouncedExactAmountFiat, isDebouncingExactAmountFiat] = useDebounceWithStatus({
    value: exactAmountFiat,
    delay: SWAP_FORM_DEBOUNCE_TIME_MS,
    skipDebounce: hasExactCurrencyFieldChanged,
  })

  return {
    debouncedExactAmountToken: debouncedExactAmountToken ?? '',
    isDebouncingExactAmountToken,
    debouncedExactAmountFiat: debouncedExactAmountFiat ?? '',
    isDebouncingExactAmountFiat,
  }
}
