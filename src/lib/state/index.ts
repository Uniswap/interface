import { createMulticall } from '@uniswap/redux-multicall'
import { atom } from 'jotai'
import { atomWithStore } from 'jotai/redux'
import { atomWithDefault } from 'jotai/utils'
import { createStore } from 'redux'
import { Web3ReactHooks } from 'widgets-web3-react/core'
import { Network } from 'widgets-web3-react/network'
import { Connector } from 'widgets-web3-react/types'

const EMPTY_CONNECTOR = [undefined, undefined]

export const networkConnectorAtom = atomWithDefault<[Network, Web3ReactHooks] | typeof EMPTY_CONNECTOR>(
  () => EMPTY_CONNECTOR
)
export const injectedConnectorAtom = atomWithDefault<[Connector, Web3ReactHooks] | typeof EMPTY_CONNECTOR>(
  () => EMPTY_CONNECTOR
)

export const connectorAtom = atom((get) => {
  const injectedContext = get(injectedConnectorAtom)
  const [connector] = injectedContext
  return connector ? injectedContext : get(networkConnectorAtom)
})

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
