import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useActiveWeb3React } from '../hooks'
import { ChainId } from 'uniswap-fuse-sdk'

export function RedirectToDefault(props: RouteComponentProps) {
  const { chainId } = useActiveWeb3React()

  const path = chainId === ChainId.FUSE ? '/swap' : '/bridge'

  return (
    <Redirect
      to={{
        ...props,
        pathname: path
      }}
    />
  )
}
