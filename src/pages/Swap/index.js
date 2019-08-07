import React from 'react'
import ExchangePage from '../../components/ExchangePage'
import { getQueryParam } from '../../utils'

export default function Swap({ initialCurrency, location }) {
  const inputCurrency = getQueryParam(location, 'inputCurrency')
  const outputCurrency = getQueryParam(location, 'outputCurrency')
  const slippage = getQueryParam(location, 'slippage')
  console.log(slippage)
  return (
    <ExchangePage
      initialCurrency={initialCurrency}
      outputCurrencyURL={outputCurrency}
      inputCurrencyURL={inputCurrency}
      slippageURL={slippage}
    />
  )
}
