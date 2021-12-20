import { useAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import { injectedConnectorAtom, networkConnectorAtom } from 'lib/state'
import { ReactNode, useEffect } from 'react'
import { initializeConnector } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Network } from 'widgets-web3-react/network'
import { Provider as EthProvider } from 'widgets-web3-react/types'

interface Web3ProviderProps {
  provider?: EthProvider
  jsonRpcEndpoint?: string
  children: ReactNode
}

export default function Web3Provider({ provider, jsonRpcEndpoint, children }: Web3ProviderProps) {
  const [, setNetworkConnector] = useAtom(networkConnectorAtom)
  useEffect(() => {
    if (jsonRpcEndpoint) {
      const [connector, hooks] = initializeConnector<Network>((actions) => new Network(actions, jsonRpcEndpoint))
      setNetworkConnector([connector, hooks])
    } else {
      setNetworkConnector(RESET)
    }
  }, [setNetworkConnector, jsonRpcEndpoint])

  const [, setInjectedConnector] = useAtom(injectedConnectorAtom)
  useEffect(() => {
    if (provider) {
      const [connector, hooks] = initializeConnector<EIP1193>((actions) => new EIP1193(actions, provider))
      setInjectedConnector([connector, hooks])
    } else {
      setInjectedConnector(RESET)
    }
  }, [setInjectedConnector, provider])

  return <>{children}</>
}
