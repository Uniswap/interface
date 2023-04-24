import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

export type BaseDerivedInfo<TInput = CurrencyInfo> = {
  currencies: {
    [CurrencyField.INPUT]: NullUndefined<TInput>
  }
  currencyAmounts: {
    [CurrencyField.INPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  currencyBalances: {
    [CurrencyField.INPUT]: NullUndefined<CurrencyAmount<Currency>>
  }
  exactAmountUSD?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}
