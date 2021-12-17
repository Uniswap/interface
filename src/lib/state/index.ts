import { createMulticall } from '@uniswap/redux-multicall'
import { NETWORK_URLS } from 'connectors'
import { atom } from 'jotai'
import { atomWithStore } from 'jotai/redux'
import { createStore } from 'redux'
import { Web3ReactHooks } from 'widgets-web3-react/core'
import { initializeConnector } from 'widgets-web3-react/core'
import { Network } from 'widgets-web3-react/network'
import { Connector } from 'widgets-web3-react/types'

export const networkConnectorAtom = atom<[Network, Web3ReactHooks]>(
  initializeConnector<Network>((actions) => new Network(actions, NETWORK_URLS))
)
export const injectedConnectorAtom = atom<[Connector, Web3ReactHooks] | [undefined, undefined]>([undefined, undefined])

export const connectorAtom = atom((get) => {
  const injectedContext = get(injectedConnectorAtom)
  const [connector] = injectedContext
  return connector ? injectedContext : get(networkConnectorAtom)
})

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
