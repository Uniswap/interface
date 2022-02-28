import { initializeConnector, Web3ReactHooks } from '@web3-react/core'
import { EMPTY } from '@web3-react/empty'
import { Connector, Web3ReactStore } from '@web3-react/types'
import { atomWithDefault } from 'jotai/utils'

export type Web3ReactState = [Connector, Web3ReactHooks, Web3ReactStore]

const EMPTY_CONNECTOR = initializeConnector(() => EMPTY)

export const urlAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
export const injectedAtom = atomWithDefault<Web3ReactState>(() => EMPTY_CONNECTOR)
