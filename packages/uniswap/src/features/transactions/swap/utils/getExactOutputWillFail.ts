import { Token } from '@uniswap/sdk-core'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/types/currency'

function getHasTokenFee(currencyInfo: Maybe<CurrencyInfo>): {
  hasBuyTax: boolean
  hasSellTax: boolean
} {
  if (!(currencyInfo?.currency instanceof Token)) {
    return { hasBuyTax: false, hasSellTax: false }
  }

  return {
    hasBuyTax: !!currencyInfo.currency.buyFeeBps && currencyInfo.currency.buyFeeBps.gt(0),
    hasSellTax: !!currencyInfo.currency.sellFeeBps && currencyInfo.currency.sellFeeBps.gt(0),
  }
}

export function getExactOutputWillFail({
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
  const { hasBuyTax: inputTokenHasBuyTax, hasSellTax: inputTokenHasSellTax } = getHasTokenFee(
    currencies[CurrencyField.INPUT],
  )
  const { hasBuyTax: outputTokenHasBuyTax, hasSellTax: outputTokenHasSellTax } = getHasTokenFee(
    currencies[CurrencyField.OUTPUT],
  )
  const exactOutputWillFail = inputTokenHasSellTax || outputTokenHasBuyTax
  const exactOutputWouldFailIfCurrenciesSwitched = inputTokenHasBuyTax || outputTokenHasSellTax

  return {
    outputTokenHasBuyTax,
    exactOutputWillFail,
    exactOutputWouldFailIfCurrenciesSwitched,
  }
}
