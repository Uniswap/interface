import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { EMPTY } from '@web3-react/empty'
import { Connector } from '@web3-react/types'
import { atomWithDefault } from 'jotai/utils'

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)

export type Web3ReactState = [Connector, Web3ReactHooks]

export const urlAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
