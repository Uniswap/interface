import { atomWithDefault } from 'jotai/utils'
import { initializeConnector, Web3ReactHooks } from 'web3-react-alpha-core'
import { EMPTY } from 'web3-react-alpha-empty'
import { Connector } from 'web3-react-alpha-types'

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)

export type Web3ReactState = [Connector, Web3ReactHooks]

export const urlAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
