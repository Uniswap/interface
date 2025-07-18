import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { CurrencyField } from 'uniswap/src/types/currency'

/**
 * We want the `DecimalPad` to always control one of the 2 inputs even when no input is focused,
 * which can happen after the user hits `Max`.
 */
export const useDecimalPadControlledField = (): CurrencyField => {
  const { focusOnCurrencyField, exactCurrencyField } = useSwapFormStore((s) => ({
    focusOnCurrencyField: s.focusOnCurrencyField,
    exactCurrencyField: s.exactCurrencyField,
  }))

  return focusOnCurrencyField ?? exactCurrencyField
}
