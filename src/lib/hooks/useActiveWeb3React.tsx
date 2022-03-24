import { getPriorityConnector, initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'
import { EMPTY } from '@web3-react/empty'
import { Actions, Connector, Provider as Eip1193Provider } from '@web3-react/types'
import { Url } from '@web3-react/url'
import { useAtom, WritableAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { atomWithDefault, RESET, useUpdateAtom } from 'jotai/utils'
import { PropsWithChildren, useEffect } from 'react'

const [connector, hooks] = initializeConnector(() => EMPTY)
const EMPTY_CONNECTOR: [Connector, Web3ReactHooks] = [connector, hooks]
const urlConnectorAtom = atomWithDefault<[Connector, Web3ReactHooks]>(() => EMPTY_CONNECTOR)
const injectedConnectorAtom = atomWithDefault<[Connector, Web3ReactHooks]>(() => EMPTY_CONNECTOR)
const web3Atom = atomWithDefault<ReturnType<typeof hooks.useWeb3React>>(() => ({
  connector: EMPTY_CONNECTOR[0],
  library: undefined,
  chainId: undefined,
  account: undefined,
  active: false,
  error: undefined,
}))

export default function useActiveWeb3React() {
  return useAtomValue(web3Atom)
}

function useConnector<T extends { new (actions: Actions, initializer: I): Connector }, I>(
  connectorAtom: WritableAtom<[Connector, Web3ReactHooks], typeof RESET | [Connector, Web3ReactHooks]>,
  Connector: T,
  initializer: I | undefined
) {
  const [connector, setConnector] = useAtom(connectorAtom)
  useEffect(() => {
    if (initializer) {
      const [connector, hooks] = initializeConnector((actions) => new Connector(actions, initializer))
      connector.activate()
      setConnector([connector, hooks])
    } else {
      setConnector(RESET)
    }
  }, [Connector, initializer, setConnector])
  return connector
}

interface Web3ProviderProps {
  provider?: Eip1193Provider
  jsonRpcEndpoint?: string
}

export function Web3Provider({ provider, jsonRpcEndpoint, children }: PropsWithChildren<Web3ProviderProps>) {
  const injectedConnector = useConnector(injectedConnectorAtom, EIP1193, provider)
  const urlConnector = useConnector(urlConnectorAtom, Url, jsonRpcEndpoint)
  const priorityConnector = getPriorityConnector(injectedConnector, urlConnector)
  const priorityProvider = priorityConnector.usePriorityProvider()
  const priorityWeb3React = priorityConnector.usePriorityWeb3React(priorityProvider)
  const setWeb3 = useUpdateAtom(web3Atom)
  useEffect(() => {
    setWeb3(priorityWeb3React)
  }, [priorityWeb3React, setWeb3])

  // Log web3 errors to facilitate debugging.
  const error = priorityConnector.usePriorityError()
  useEffect(() => {
    if (error) {
      console.error('web3 error:', error)
    }
  }, [error])

  return <>{children}</>
}
