import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/types/currency'

export type BaseDerivedInfo<TInput = CurrencyInfo> = {
  currencies: {
    [CurrencyField.INPUT]: Maybe<TInput>
  }
  currencyAmounts: {
    [CurrencyField.INPUT]: Maybe<CurrencyAmount<Currency>>
  }
  currencyBalances: {
    [CurrencyField.INPUT]: Maybe<CurrencyAmount<Currency>>
  }
  exactAmountFiat?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}
