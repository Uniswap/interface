import { createMulticall } from '@uniswap/redux-multicall'
import { atomWithStore } from 'jotai/redux'
import { atomWithDefault, useAtomValue } from 'jotai/utils'
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

type Web3ReactState = [Connector, Web3ReactHooks]

export const networkAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)

export function useActiveWeb3ReactState(): Web3ReactState {
  const injected = useAtomValue(injectedAtom)
  const network = useAtomValue(networkAtom)
  return injected[1].useIsActive() ? injected : network
}

export function useActiveWeb3ReactHooks(): Web3ReactHooks {
  const [, hooks] = useActiveWeb3ReactState()
  return hooks
}

export function useActiveWeb3React() {
  const { useProvider, useWeb3React } = useActiveWeb3ReactHooks()
  return useWeb3React(useProvider())
}

export const multicall = createMulticall()
const multicallStore = createStore(multicall.reducer)
export const multicallStoreAtom = atomWithStore(multicallStore)
