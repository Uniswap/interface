import { useUpdateAtom } from 'jotai/utils'
import { injectedConnectorAtom, networkConnectorAtom } from 'lib/state'
import { useEffect } from 'react'
import { initializeConnector } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Network } from 'widgets-web3-react/network'
import { Provider as EthProvider } from 'widgets-web3-react/types'

export default function useProviderInfo(provider: EthProvider | undefined, jsonRpcEndpoint: string | undefined) {
  const setNetworkConnector = useUpdateAtom(networkConnectorAtom)
  useEffect(() => {
    if (jsonRpcEndpoint) {
      const [connector, hooks] = initializeConnector<Network>((actions) => new Network(actions, jsonRpcEndpoint))
      setNetworkConnector([connector, hooks])
    }
  }, [setNetworkConnector, jsonRpcEndpoint])

  const setInjectedConnector = useUpdateAtom(injectedConnectorAtom)
  useEffect(() => {
    if (provider) {
      const [connector, hooks] = initializeConnector<EIP1193>((actions) => new EIP1193(actions, provider))
      setInjectedConnector([connector, hooks])
    }
  }, [setInjectedConnector, provider])
}
