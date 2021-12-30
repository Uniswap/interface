import { SetStateAction } from 'jotai'
import { RESET, useUpdateAtom } from 'jotai/utils'
import { injectedAtom, networkAtom } from 'lib/state'
import { ReactNode, useEffect, useMemo } from 'react'
import { initializeConnector, Web3ReactHooks } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Network } from 'widgets-web3-react/network'
import { Actions, Connector, Provider as EthProvider } from 'widgets-web3-react/types'

interface Web3ProviderProps {
  jsonRpcEndpoint?: string
  provider?: EthProvider
  children: ReactNode
}

function useConnector<T extends { new (actions: Actions, initializer: I): Connector }, I>(
  Connector: T,
  initializer: I | undefined,
  setContext: (update: typeof RESET | SetStateAction<[Connector, Web3ReactHooks]>) => void
) {
  return useEffect(() => {
    if (initializer) {
      const [connector, hooks] = initializeConnector((actions) => new Connector(actions, initializer))
      setContext([connector, hooks])
    } else {
      setContext(RESET)
    }
  }, [Connector, initializer, setContext])
}

export default function Web3Provider({ jsonRpcEndpoint, provider, children }: Web3ProviderProps) {
  const setNetwork = useUpdateAtom(networkAtom)
  // TODO(zzmp): Network should take a string, not a urlMap.
  const urlMap = useMemo(() => jsonRpcEndpoint && { 1: jsonRpcEndpoint }, [jsonRpcEndpoint])
  useConnector(Network, urlMap, setNetwork)

  const setInjected = useUpdateAtom(injectedAtom)
  useConnector(EIP1193, provider, setInjected)

  return <>{children}</>
}
