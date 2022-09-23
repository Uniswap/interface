import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { useGlobalChainName } from 'graphql/data/util'
import { useEffect, useRef } from 'react'

export const useOnGlobalChainSwitch = (callback: (chain: Chain) => void) => {
  const globalChainName = useGlobalChainName()
  const prevGlobalChainRef = useRef(globalChainName)
  useEffect(() => {
    if (prevGlobalChainRef.current !== globalChainName) {
      callback(globalChainName)
    }
    prevGlobalChainRef.current = globalChainName
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalChainName])
}
