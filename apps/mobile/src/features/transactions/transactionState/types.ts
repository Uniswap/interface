import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

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
  exactAmountUSD?: string
  exactAmountToken: string
  exactCurrencyField: CurrencyField
}
