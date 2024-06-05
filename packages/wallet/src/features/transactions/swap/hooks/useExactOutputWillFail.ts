import { Token } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export function useExactOutputWillFail({
  currencies,
}: {
  currencies: {
    input: Maybe<CurrencyInfo>
    output: Maybe<CurrencyInfo>
  }
}): {
  outputTokenHasBuyTax: boolean
  exactOutputWillFail: boolean
  exactOutputWouldFailIfCurrenciesSwitched: boolean
} {
  const inputTokenHasBuyTax =
    currencies[CurrencyField.INPUT]?.currency instanceof Token &&
    !!currencies[CurrencyField.INPUT]?.currency.buyFeeBps
  const inputTokenHasSellTax =
    currencies[CurrencyField.INPUT]?.currency instanceof Token &&
    !!currencies[CurrencyField.INPUT]?.currency.sellFeeBps
  const outputTokenHasBuyTax =
    currencies[CurrencyField.OUTPUT]?.currency instanceof Token &&
    !!currencies[CurrencyField.OUTPUT]?.currency.buyFeeBps
  const outputTokenHasSellTax =
    currencies[CurrencyField.OUTPUT]?.currency instanceof Token &&
    !!currencies[CurrencyField.OUTPUT]?.currency.sellFeeBps
  const exactOutputWillFail = inputTokenHasSellTax || outputTokenHasBuyTax
  const exactOutputWouldFailIfCurrenciesSwitched = inputTokenHasBuyTax || outputTokenHasSellTax

  return {
    outputTokenHasBuyTax,
    exactOutputWillFail,
    exactOutputWouldFailIfCurrenciesSwitched,
  }
}
