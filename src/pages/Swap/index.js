import React from 'react'
import ExchangePage from '../../components/ExchangePage'
import { getQueryParam, isAddress } from '../../utils'

export default function Swap({ initialCurrency, location }) {
  const inputCurrency = isAddress(getQueryParam(location, 'inputCurrency'))
    ? getQueryParam(location, 'inputCurrency')
    : ''
  const outputCurrency = isAddress(getQueryParam(location, 'outputCurrency'))
    ? getQueryParam(location, 'outputCurrency')
    : ''
  const slippage = !isNaN(getQueryParam(location, 'slippage')) ? getQueryParam(location, 'slippage') : ''
  const exactField = getQueryParam(location, 'exactField')
  const exactAmount = !isNaN(getQueryParam(location, 'exactAmount')) ? getQueryParam(location, 'exactAmount') : ''
  const darkMode = getQueryParam(location, 'darkMode')

  return (
    <ExchangePage
      initialCurrency={initialCurrency}
      outputCurrencyURL={outputCurrency}
      inputCurrencyURL={inputCurrency}
      slippageURL={slippage}
      exactFieldURL={exactField}
      exactAmountURL={exactAmount}
      darkModeURL={darkMode === 'true' || darkMode === 'false' ? darkMode : ''}
      location={location}
    />
  )
}
