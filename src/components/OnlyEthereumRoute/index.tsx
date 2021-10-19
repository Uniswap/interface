import React from 'react'
import { useActiveWeb3React } from 'hooks'
import { Route, Redirect } from 'react-router-dom'
import { ChainId } from '@dynamic-amm/sdk'

function OnlyEthereumRoute({ component, path, exact }: { component: React.FC; path: string; exact: boolean }) {
  const { chainId } = useActiveWeb3React()

  const supported = chainId && [ChainId.MAINNET, ChainId.ROPSTEN].includes(chainId)

  return supported ? <Route component={component} path={path} exact={exact} /> : <Redirect to="/" />
}

export default OnlyEthereumRoute
