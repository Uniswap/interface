import React from 'react'

import ExchangePage from '../../components/ExchangePage'

export default function Send({ params }) {
  return <ExchangePage sendingInput={true} params={params} />
}
