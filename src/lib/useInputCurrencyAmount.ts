import { Currency, CurrencyAmount } from '@uniswap/sdk-core'

import { useIsAmountPopulated, useIsSwapFieldIndependent, useSwapAmount, useSwapCurrency } from './hooks/swap'
import { Field } from './state/swap'
import tryParseCurrencyAmount from './utils/tryParseCurrencyAmount'

export default function useInputCurrencyAmount(): CurrencyAmount<Currency> | undefined {
  const isFieldIndependent = useIsSwapFieldIndependent(Field.INPUT)
  const isAmountPopulated = useIsAmountPopulated()
  const [swapInputAmount] = useSwapAmount(Field.INPUT)
  const [swapInputCurrency] = useSwapCurrency(Field.INPUT)
  if (isFieldIndependent && isAmountPopulated) {
    return tryParseCurrencyAmount(swapInputAmount, swapInputCurrency)
  }
  return
}
