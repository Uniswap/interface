import React from 'react'

import ExchangePage from '../../components/ExchangePage'
import { QueryParams } from '../../utils'

export default function Send({ params }: { params: QueryParams }) {
  return <ExchangePage sendingInput={true} params={params} />
}
