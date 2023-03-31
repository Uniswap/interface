import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { isSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import { ReactNode, useEffect, useMemo } from 'react'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(() => connections.map((connection) => connection.getName()).join('-'), [connections])

  return (
    <Web3ReactProvider connectors={connectors} key={key}>
      <Tracer />
      {children}
    </Web3ReactProvider>
  )
}

function Tracer() {
  const { chainId, provider } = useWeb3React()
  const networkProvider = isSupportedChain(chainId) ? RPC_PROVIDERS[chainId] : undefined
  const shouldTrace = useTraceJsonRpcFlag() === TraceJsonRpcVariant.Enabled

  useEffect(() => {
    if (shouldTrace) {
      provider?.on('debug', trace)
      if (provider !== networkProvider) {
        networkProvider?.on('debug', trace)
      }
    }
    return () => {
      provider?.off('debug', trace)
      networkProvider?.off('debug', trace)
    }
  }, [networkProvider, provider, shouldTrace])

  return null
}

function trace(event: any) {
  if (event.action !== 'request') return
  const { method, id, params } = event.request
  console.groupCollapsed(method, id)
  console.debug(params)
  console.groupEnd()
}
