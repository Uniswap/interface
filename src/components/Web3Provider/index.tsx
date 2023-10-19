import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnection, getConnections } from 'connection'
import { isSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useEffect, useMemo } from 'react'
import { useConnectedWallets } from 'state/wallets/hooks'
export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connectors = getConnections().map<[Connector, Web3ReactHooks]>(({ hooks, connector }) => [connector, hooks])

  const key = useMemo(
    () =>
      getConnections()
        .map((connection) => connection.getName())
        .join('-'),
    []
  )

  return (
    connectors && (
      <Web3ReactProvider connectors={connectors} key={key}>
        <Tracer />
        {children}
      </Web3ReactProvider>
    )
  )
}

function Updater() {
  const { account, chainId, connector, provider } = useWeb3React()

  // Trace RPC calls (for debugging).
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

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    if (account && account !== previousAccount) {
      const walletType = getConnection(connector).getName()

      addConnectedWallet({ account, walletType })
    }
  }, [account, addConnectedWallet, chainId, connectedWallets, connector, previousAccount, provider])

  return null
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
  if (!event?.request) return
  const { method, id, params } = event.request
  console.groupCollapsed(method, id)
  console.debug(params)
  console.groupEnd()
}
