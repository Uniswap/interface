import { atom } from 'jotai'
import { atomWithImmer } from 'jotai/immer'
import { atomWithReset } from 'jotai/utils'
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

export enum State {
  EMPTY,
  LOADING,
  TOKEN_APPROVAL,
  BALANCE_INSUFFICIENT,
  LOADED,
  PENDING,
}

export enum Field {
  INPUT = 'input',
  OUTPUT = 'output',
}

export interface Input {
  value?: number
  token?: Token
  usdc?: number
}

export interface Swap {
  state: State
  activeInput: Field
  [Field.INPUT]: Input
  [Field.OUTPUT]: Input
  swap?: {
    lpFee: number
    priceImpact: number
    slippageTolerance: number
    integratorFee?: number
    maximumSent?: number
    minimumReceived?: number
  }
}

export const swapAtom = atomWithImmer<Swap>({
  state: State.LOADING,
  activeInput: Field.INPUT,
  input: { token: ETH },
  output: {},
})

export const stateAtom = pickAtom(swapAtom, 'state')

export const inputAtom = atom(
  (get) => get(swapAtom).input,
  (get, set, update: Input) => {
    set(swapAtom, (swap) => {
      swap.activeInput = Field.INPUT
      swap.input = update
    })
  }
)

export const outputAtom = atom(
  (get) => get(swapAtom).output,
  (get, set, update: Input) => {
    set(swapAtom, (swap) => {
      swap.activeInput = Field.OUTPUT
      swap.output = update
    })
  }
)
