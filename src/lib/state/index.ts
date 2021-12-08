import { createMulticall } from '@uniswap/redux-multicall'
import { atom } from 'jotai'
import { atomWithStore } from 'jotai/redux'
import EIP1193Connector from 'lib/connectors/EIP1193'
import { createStore } from 'redux'

export const connectorAtom = atom<EIP1193Connector | undefined>(undefined)

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
