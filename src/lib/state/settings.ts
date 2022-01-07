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

export interface Settings {
  maxSlippage: Customizable<MaxSlippage>
  transactionTtl: number | undefined
  mockTogglable: boolean
}

const initialSettings: Settings = {
  maxSlippage: { value: MaxSlippage.DEFAULT },
  transactionTtl: undefined,
  mockTogglable: true,
}

export const settingsAtom = atomWithReset(initialSettings)
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage', setCustomizable(MaxSlippage))
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const mockTogglableAtom = pickAtom(settingsAtom, 'mockTogglable', setTogglable)
