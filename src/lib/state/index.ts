import { createMulticall } from '@uniswap/redux-multicall'
import { atomWithStore } from 'jotai/redux'
import { atomWithDefault } from 'jotai/utils'
import { createStore } from 'redux'
import { Web3ReactHooks } from 'widgets-web3-react/core'
import { initializeConnector } from 'widgets-web3-react/core'
import { Connector } from 'widgets-web3-react/types'

// TODO(zzmp): EmptyConnector singleton should come from 'widgets-web3-react/empty'
const EMPTY_CONNECTOR = initializeConnector<Connector>(
  (actions) =>
    new (class EmptyConnector extends Connector {
      activate() {
        void 0
      }
    })(actions)
)

export type Web3ReactState = [Connector, Web3ReactHooks]

export const networkAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
