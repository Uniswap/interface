import React from 'react'
import ExchangePage from '../../components/ExchangePage'
import { isAddress } from '../../utils'

function getQueryParam(windowLocation, name) {
  var q = windowLocation.search.match(new RegExp('[?&]' + name + '=([^&#]*)'))
  return q && q[1]
}

export default function Swap({ initialCurrency, location }) {
  let x = getQueryParam(location, 'inputCurrency')
  if (!isAddress(x)) {
    x = ''
  }
  return <ExchangePage initialCurrency={initialCurrency} inputCurrencyURL={x} />
}
