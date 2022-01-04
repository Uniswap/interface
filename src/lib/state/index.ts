import { createMulticall } from '@uniswap/redux-multicall'
import { atomWithStore } from 'jotai/redux'
import { atomWithDefault } from 'jotai/utils'
import { createStore } from 'redux'
import { initializeConnector, Web3ReactHooks } from 'widgets-web3-react/core'
import { EMPTY } from 'widgets-web3-react/empty'
import { Connector } from 'widgets-web3-react/types'

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)

export type Web3ReactState = [Connector, Web3ReactHooks]

export const urlAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
