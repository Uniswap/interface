import { useWeb3React } from '@web3-react/core'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { chainIdToBackendName } from 'graphql/data/util'
import { useEffect, useRef } from 'react'

export const useOnGlobalChainSwitch = (callback: (chain: Chain) => void) => {
  const { chainId: connectedChainId } = useWeb3React()
  const globalChainName = chainIdToBackendName(connectedChainId)
  const prevGlobalChainRef = useRef(globalChainName)
  useEffect(() => {
    if (prevGlobalChainRef.current !== globalChainName) {
      callback(globalChainName)
    }
    prevGlobalChainRef.current = globalChainName
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalChainName])
}
