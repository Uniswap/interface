import React from 'react'
import ExchangePage from '../../components/ExchangePage'
import { getQueryParam } from '../../utils'

export default function Send({ initialCurrency, location }) {
  const recipient = getQueryParam(location, 'recipient')
  const inputCurrency = getQueryParam(location, 'inputCurrency')
  const outputCurrency = getQueryParam(location, 'outputCurrency')
  const slippage = getQueryParam(location, 'slippage')
  const exactField = getQueryParam(location, 'exactField')
  const exactAmount = getQueryParam(location, 'exactAmount')

  return (
    <ExchangePage
      initialCurrency={initialCurrency}
      outputCurrencyURL={outputCurrency}
      inputCurrencyURL={inputCurrency}
      slippageURL={slippage}
      recipientURL={recipient}
      sending={true}
      exactFieldURL={exactField}
      exactAmountURL={exactAmount}
      location={location}
    />
  )
}
