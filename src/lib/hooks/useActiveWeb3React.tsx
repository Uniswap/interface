import { ExternalProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
import { EMPTY } from '@web3-react/empty'
import { Actions, Connector, Provider as Eip1193Provider, Web3ReactStore } from '@web3-react/types'
import { Url } from '@web3-react/url'
import { useAtom, WritableAtom } from 'jotai'
import { atom } from 'jotai'
import JsonRpcConnector from 'lib/utils/JsonRpcConnector'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react'

type Web3ContextType = {
  connector: Connector
  library?: (JsonRpcProvider & { provider?: ExternalProvider }) | Web3Provider
  chainId?: ReturnType<Web3ReactHooks['useChainId']>
  accounts?: ReturnType<Web3ReactHooks['useAccounts']>
  account?: ReturnType<Web3ReactHooks['useAccount']>
  active?: ReturnType<Web3ReactHooks['useIsActive']>
  activating?: ReturnType<Web3ReactHooks['useIsActivating']>
  error?: ReturnType<Web3ReactHooks['useError']>
  ensNames?: ReturnType<Web3ReactHooks['useENSNames']>
  ensName?: ReturnType<Web3ReactHooks['useENSName']>
}

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)
const EMPTY_CONTEXT: Web3ContextType = { connector: EMPTY }
const jsonRpcConnectorAtom = atom<[Connector, Web3ReactHooks, Web3ReactStore]>(EMPTY_CONNECTOR)
const injectedConnectorAtom = atom<[Connector, Web3ReactHooks, Web3ReactStore]>(EMPTY_CONNECTOR)
const Web3Context = createContext(EMPTY_CONTEXT)

export default function useActiveWeb3React() {
  return useContext(Web3Context)
}

function useConnector<T extends { new (actions: Actions, initializer: I): Connector }, I>(
  connectorAtom: WritableAtom<[Connector, Web3ReactHooks, Web3ReactStore], [Connector, Web3ReactHooks, Web3ReactStore]>,
  Connector: T,
  initializer: I | undefined
) {
  const [connector, setConnector] = useAtom(connectorAtom)
  useEffect(() => {
    if (initializer) {
      const [connector, hooks, store] = initializeConnector((actions) => new Connector(actions, initializer))
      connector.activate()
      setConnector([connector, hooks, store])
    } else {
      setConnector(EMPTY_CONNECTOR)
    }
  }, [Connector, initializer, setConnector])
  return connector
}

interface ActiveWeb3ProviderProps {
  provider?: Eip1193Provider | JsonRpcProvider
  jsonRpcEndpoint?: string | JsonRpcProvider
}

export function ActiveWeb3Provider({
  provider,
  jsonRpcEndpoint,
  children,
}: PropsWithChildren<ActiveWeb3ProviderProps>) {
  const Injected = useMemo(() => {
    if (provider) {
      if (JsonRpcProvider.isProvider(provider)) return JsonRpcConnector
      if (JsonRpcProvider.isProvider((provider as any).provider)) {
        throw new Error('Eip1193Bridge is experimental: pass your ethers Provider directly')
      }
    }
    return EIP1193
  }, [provider]) as { new (actions: Actions, initializer: typeof provider): Connector }
  const injectedConnector = useConnector(injectedConnectorAtom, Injected, provider)
  const JsonRpc = useMemo(() => {
    if (JsonRpcProvider.isProvider(jsonRpcEndpoint)) return JsonRpcConnector
    return Url
  }, [jsonRpcEndpoint]) as { new (actions: Actions, initializer: typeof jsonRpcEndpoint): Connector }
  const jsonRpcConnector = useConnector(jsonRpcConnectorAtom, JsonRpc, jsonRpcEndpoint)
  const [connector, hooks] = injectedConnector[1].useIsActive()
    ? injectedConnector
    : jsonRpcConnector ?? EMPTY_CONNECTOR

  const library = hooks.useProvider()

  const accounts = hooks.useAccounts()
  const account = hooks.useAccount()
  const activating = hooks.useIsActivating()
  const active = hooks.useIsActive()
  const chainId = hooks.useChainId()
  const ensNames = hooks.useENSNames()
  const ensName = hooks.useENSName()
  const error = hooks.useError()
  const web3 = useMemo(() => {
    if (connector === EMPTY || !(active || activating)) {
      return EMPTY_CONTEXT
    }
    return { connector, library, chainId, accounts, account, active, activating, error, ensNames, ensName }
  }, [account, accounts, activating, active, chainId, connector, ensName, ensNames, error, library])

  // Log web3 errors to facilitate debugging.
  useEffect(() => {
    if (error) {
      console.error('web3 error:', error)
    }
  }, [error])

  return <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>
}
