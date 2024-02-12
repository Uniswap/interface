import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

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
