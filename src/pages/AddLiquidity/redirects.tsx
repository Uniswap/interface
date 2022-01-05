import { useActiveWeb3React } from 'hooks/web3'
import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import AddLiquidity from './index'
import { WETH9 } from 'constants/tokens'

export function RedirectDuplicateTokenIds(
  props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; feeAmount?: string }>
) {
  const {
    match: {
      params: { currencyIdA, currencyIdB },
    },
  } = props

  const { chainId } = useActiveWeb3React()

  // prevent weth + eth
  const isETHOrWETHA = currencyIdA === 'ETH' || (chainId !== undefined && currencyIdA === WETH9[chainId]?.address)
  const isETHOrWETHB = currencyIdB === 'ETH' || (chainId !== undefined && currencyIdB === WETH9[chainId]?.address)

  if (
    currencyIdA &&
    currencyIdB &&
    (currencyIdA.toLowerCase() === currencyIdB.toLowerCase() || (isETHOrWETHA && isETHOrWETHB))
  ) {
    return <Redirect to={`/add/${currencyIdA}`} />
  }
  return <AddLiquidity {...props} />
}
