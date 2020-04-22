import React from 'react'

import ExchangePage from '../../components/ExchangePage'

export default function Send({ initialCurrency, params }) {
  return <ExchangePage sendingInput={true} initialCurrency={initialCurrency} params={params} />
}
