/* eslint-disable react-hooks/rules-of-hooks */
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from 'web3-react-core'

import { NetworkContextName } from '../constants/misc'

export default function useActiveWeb3React() {
  const interfaceContext = useWeb3React<Web3Provider>()
  const interfaceNetworkContext = useWeb3React<Web3Provider>(
    process.env.REACT_APP_IS_WIDGET ? undefined : NetworkContextName
  )

  if (interfaceContext.active) {
    return interfaceContext
  }

  return interfaceNetworkContext
}
