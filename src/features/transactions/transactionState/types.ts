import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

export type BaseDerivedInfo<TInput = Currency> = {
  currencies: {
    [CurrencyField.INPUT]: NullUndefined<TInput>
  }
  currencyAmounts: {
    [CurrencyField.INPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  currencyBalances: {
    [CurrencyField.INPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  formattedAmounts: {
    [CurrencyField.INPUT]: string
  }
  exactAmountUSD?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}
