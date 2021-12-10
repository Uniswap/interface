import { createMulticall } from '@uniswap/redux-multicall'
import { atom } from 'jotai'
import { atomWithStore } from 'jotai/redux'
import { createStore } from 'redux'
import { Web3ReactHooks } from 'widgets-web3-react/core'
import { Network } from 'widgets-web3-react/network'
import { Connector } from 'widgets-web3-react/types'

export const networkConnectorAtom = atom<[Network, Web3ReactHooks] | undefined>(undefined)
export const injectedConnectorAtom = atom<[Connector, Web3ReactHooks] | undefined>(undefined)

export const connectorAtom = atom((get) => get(injectedConnectorAtom) || get(networkConnectorAtom))

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
