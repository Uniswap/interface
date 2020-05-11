import React from 'react'
import ExchangePage from '../../components/ExchangePage'
import { QueryParams } from '../../utils'

export default function Swap({ params }: { params: QueryParams }) {
  return <ExchangePage sendingInput={false} params={params} />
}
