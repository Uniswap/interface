import { Percent } from '@uniswap/sdk-core'
import { atomWithReset } from 'jotai/utils'

import { pickAtom, setTogglable } from './atoms'

export const TRANSACTION_TTL_DEFAULT = 40

interface Settings {
  maxSlippage: Percent | 'auto' // auto will cause slippage to resort to default calculation
  transactionTtl: number | undefined
  mockTogglable: boolean
  clientSideRouter: boolean // wether to use
}

const initialSettings: Settings = {
  maxSlippage: 'auto',
  transactionTtl: TRANSACTION_TTL_DEFAULT,
  mockTogglable: true,
  clientSideRouter: false,
}

export const settingsAtom = atomWithReset(initialSettings)
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage')
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const mockTogglableAtom = pickAtom(settingsAtom, 'mockTogglable', setTogglable)
export const clientSideRouterAtom = pickAtom(settingsAtom, 'clientSideRouter')
