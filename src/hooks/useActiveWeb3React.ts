/* eslint-disable react-hooks/rules-of-hooks */
import { Web3Provider } from '@ethersproject/providers'
import { default as useWidgetsWeb3React, Web3ContextType } from 'lib/hooks/useActiveWeb3React'
import invariant from 'tiny-invariant'
import { useWeb3React } from 'web3-react-core'

import { NetworkContextName } from '../constants/misc'

export default function useActiveWeb3React() {
  if (process.env.REACT_APP_IS_WIDGET) {
    const web3 = useWidgetsWeb3React() as Web3ContextType<Web3Provider>
    invariant(web3.library ? web3.library instanceof Web3Provider : true)
    return web3
  }

  const interfaceContext = useWeb3React<Web3Provider>()
  const interfaceNetworkContext = useWeb3React<Web3Provider>(
    process.env.REACT_APP_IS_WIDGET ? undefined : NetworkContextName
  )

  if (interfaceContext.active) {
    return interfaceContext
  }

  return interfaceNetworkContext
}
