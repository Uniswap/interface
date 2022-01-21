import { atomWithReset } from 'jotai/utils'

import { Customizable, pickAtom, setCustomizable, setTogglable } from './atoms'

/** Max slippage, as a percentage. */
export enum MaxSlippage {
  P01 = 0.1,
  P05 = 0.5,
  // Members to satisfy CustomizableEnum; see setCustomizable
  CUSTOM = -1,
  DEFAULT = P05,
}

export const TRANSACTION_TTL_DEFAULT = 40

interface Settings {
  maxSlippage: Customizable<MaxSlippage>
  transactionTtl: number | undefined
  mockTogglable: boolean
  clientSideRouter: boolean // wether to use
}

const initialSettings: Settings = {
  maxSlippage: { value: MaxSlippage.DEFAULT },
  transactionTtl: undefined,
  mockTogglable: true,
  clientSideRouter: false,
}

export const settingsAtom = atomWithReset(initialSettings)
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage', setCustomizable(MaxSlippage))
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const mockTogglableAtom = pickAtom(settingsAtom, 'mockTogglable', setTogglable)
export const clientSideRouterAtom = pickAtom(settingsAtom, 'clientSideRouter')
