import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import type { CurrencyField } from 'uniswap/src/types/currency'

/**
 * We want the `DecimalPad` to always control one of the 2 inputs even when no input is focused,
 * which can happen after the user hits `Max`.
 */
export const useDecimalPadControlledField = (): CurrencyField => {
  const { focusOnCurrencyField, exactCurrencyField } = useSwapFormContext()

  return focusOnCurrencyField ?? exactCurrencyField
}
