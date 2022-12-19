import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { Connection, setErrorHandler } from 'connection'
import { getConnectionName } from 'connection/utils'
import { isSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { dispatch } from 'd3'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import { ReactNode, useEffect, useMemo } from 'react'
import { updateConnectionError } from 'state/connection/reducer'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setErrorHandler((error) => dispatch(updateConnectionError(error.message)))
  }, [])
  // NB: Nothing is eagerly-connected on pageload until this component mounts.
  // If eager connection could be moved earlier, it could be a better UX (ie faster perceived load).
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(() => connections.map(({ type }: Connection) => getConnectionName(type)).join('-'), [connections])

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
