import React from 'react'
import { WETH } from '@kyberswap/ks-sdk-core'
import { useActiveWeb3React } from 'hooks'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import ProAmmAddLiquidity from './index'

export function RedirectDuplicateTokenIds(
  props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; feeAmount?: string }>
) {
  const {
    match: {
      params: { currencyIdA, currencyIdB }
    }
  } = props

  const { chainId } = useActiveWeb3React()

  // prevent weth + eth
  const isETHOrWETHA = currencyIdA === 'ETH' || (chainId !== undefined && currencyIdA === WETH[chainId]?.address)
  const isETHOrWETHB = currencyIdB === 'ETH' || (chainId !== undefined && currencyIdB === WETH[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Redirect to={`proamm/add/${currencyIdA}`} />
  }
  return <ProAmmAddLiquidity {...props} />
}
