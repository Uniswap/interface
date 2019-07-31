import React from 'react'
import ExchangePage from '../../components/ExchangePage'

export default function Send({ initialCurrency }) {
  return <ExchangePage initialCurrency={initialCurrency} sending={true} />
}
