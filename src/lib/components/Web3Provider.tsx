import { SetStateAction } from 'jotai'
import { RESET, useUpdateAtom } from 'jotai/utils'
import { injectedAtom, urlAtom } from 'lib/state/web3'
import { ReactNode, useEffect } from 'react'
import { initializeConnector, Web3ReactHooks } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Actions, Connector, Provider as EthProvider } from 'widgets-web3-react/types'
import { Url } from 'widgets-web3-react/url'

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
  const setUrl = useUpdateAtom(urlAtom)
  useConnector(Url, jsonRpcEndpoint, setUrl)

  const setInjected = useUpdateAtom(injectedAtom)
  useConnector(EIP1193, provider, setInjected)

  return <>{children}</>
}
