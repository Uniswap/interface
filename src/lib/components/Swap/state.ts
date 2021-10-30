import { atomWithDefault, atomWithReset } from 'jotai/utils'
import { ETH } from 'lib/mocks'
import { Token } from 'lib/types'
import { Customizable, pickAtom, setCustomizable, setTogglable } from 'lib/utils/atoms'

import Settings from './Settings'

/** Max slippage, as a percentage. */
export enum MaxSlippage {
  P01 = 0.1,
  P05 = 0.5,
  // Members to satisfy CustomizableEnum; see setCustomizable
  CUSTOM = -1,
  DEFAULT = P05,
}

export interface Settings {
  maxSlippage: Customizable<MaxSlippage>
  transactionTtl: number
  mockTogglable: boolean
}

const initialSettings: Settings = {
  maxSlippage: { value: MaxSlippage.DEFAULT },
  transactionTtl: 40,
  mockTogglable: true,
}

export const settingsAtom = atomWithReset(initialSettings)
export const maxSlippageAtom = pickAtom(settingsAtom, 'maxSlippage', setCustomizable(MaxSlippage))
export const transactionTtlAtom = pickAtom(settingsAtom, 'transactionTtl')
export const mockTogglableAtom = pickAtom(settingsAtom, 'mockTogglable', setTogglable)

export interface Input {
  value?: number
  token?: Token
}

export const inputAtom = atomWithDefault<Input>(() => ({ token: ETH }))
export const outputAtom = atomWithDefault<Input>(() => ({}))

export enum State {
  EMPTY,
  LOADING,
  TOKEN_APPROVAL,
  BALANCE_INSUFFICIENT,
  LOADED,
}

export interface Swap {
  state: State
  input?: { usdc: number }
  output?: { usdc: number }
  lpFee?: number
  integratorFee?: number
  priceImpact?: number
  maximumSent?: number
  minimumReceived?: number
  slippageTolerance?: number
}

export const swapAtom = atomWithDefault<Swap>(() => ({ state: State.LOADING }))
