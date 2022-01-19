import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai/immer'
import { useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { useMemo } from 'react'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  integratorFee?: number
}

export const stateAtom = atomWithImmer<SwapState>({
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: { currencyId: 'ETH' },
  [Field.OUTPUT]: { currencyId: undefined },
  recipient: null,
})

export const independentFieldAtom = pickAtom(stateAtom, 'independentField')
export const integratorFeeAtom = pickAtom(stateAtom, 'integratorFee')

// typed value atom and updater
export const typedValueAtom = pickAtom(stateAtom, 'typedValue')

// the input currency
export const inputAtom = atom(
  (get) => get(stateAtom).INPUT,
  (_, set, currencyId: string) => {
    set(stateAtom, (state) => {
      state.INPUT = { currencyId }
    })
  }
)

export const outputAtom = atom(
  (get) => get(stateAtom).OUTPUT,
  (_, set, currencyId: string) => {
    set(stateAtom, (state) => {
      state.OUTPUT = { currencyId }
    })
  }
)

// write only function that updates input/output currencyId based on a submitted field
export function useUpdateCurrency() {
  return useUpdateAtom(
    useMemo(
      () =>
        atom(null, (_, set, { currencyId, field }) => {
          if (field === Field.INPUT) {
            set(inputAtom, currencyId)
          } else {
            set(outputAtom, currencyId)
          }
        }),
      []
    )
  )
}

// Accepts a field and typed value, updates state
export function useSwitchCurrencies() {
  return useUpdateAtom(
    useMemo(
      () =>
        atom(null, (_, set) => {
          set(stateAtom, (state) => {
            state.OUTPUT = state[Field.INPUT]
            state.INPUT = state[Field.OUTPUT]
          })
        }),
      []
    )
  )
}

// Accepts a field and typed value, updates state
export function useUpdateTypedInput() {
  return useUpdateAtom(
    useMemo(
      () =>
        atom(null, (_, set, { typedValue, field }) => {
          set(stateAtom, (state) => {
            state.independentField = field
            state.typedValue = typedValue
          })
        }),
      []
    )
  )
}

export interface Transaction {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  receipt: string
  timestamp: number
  elapsedMs?: number
  status?: true | Error
}

export const transactionAtom = atomWithImmer<Transaction | null>(null)
