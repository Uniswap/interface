import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'

interface UseInputOutputFieldAmountArguments {
  disabled: boolean
  currencyAmount: CurrencyAmount<Currency> | undefined
  fieldAmount: string | undefined
}

function useInputOutputFieldAmount({ disabled, currencyAmount, fieldAmount }: UseInputOutputFieldAmountArguments) {
  return useMemo(() => {
    if (disabled) {
      return ''
    }
    if (fieldAmount !== undefined) {
      return fieldAmount
    }
    if (currencyAmount) {
      return currencyAmount.toSignificant(6)
    }
    return ''
  }, [disabled, currencyAmount, fieldAmount])
}

export default useInputOutputFieldAmount
