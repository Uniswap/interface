import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

export type BaseDerivedInfo<TInput = Currency> = {
  currencies: {
    [CurrencyField.INPUT]: Nullable<TInput>
  }
  currencyAmounts: {
    [CurrencyField.INPUT]: Nullable<CurrencyAmount<Currency>>
  }
  currencyBalances: {
    [CurrencyField.INPUT]: Nullable<CurrencyAmount<Currency>>
  }
  formattedAmounts: {
    [CurrencyField.INPUT]: string
  }
  exactAmountUSD?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}
