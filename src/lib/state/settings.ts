import { Percent } from '@uniswap/sdk-core'
import { atomWithReset } from 'jotai/utils'

import { pickAtom, setTogglable } from './atoms'

export const MAX_VALID_SLIPPAGE = new Percent(1, 2)
export const MIN_HIGH_SLIPPAGE = new Percent(1, 100)

interface Settings {
  maxSlippage: Percent | 'auto' // auto will cause slippage to resort to default calculation
  transactionTtl: number | undefined
  mockTogglable: boolean
  clientSideRouter: boolean // whether to use the client-side router or query the remote API
}

const initialSettings: Settings = {
  maxSlippage: 'auto',
  transactionTtl: undefined,
  mockTogglable: true,
  clientSideRouter: false,
}

export const settingsAtom = atomWithReset(initialSettings)
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage')
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const mockTogglableAtom = pickAtom(settingsAtom, 'mockTogglable', setTogglable)
export const clientSideRouterAtom = pickAtom(settingsAtom, 'clientSideRouter')
