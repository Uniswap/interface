import React from 'react'
import { RouteComponentProps } from 'react-router'
import AppBody from '../AppBody'

// TODO
export default function RemoveLiquidityV3({
  match: {
    params: { currencyIdA, currencyIdB, fee },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; fee: string }>) {
  return <AppBody>TODO</AppBody>
}
