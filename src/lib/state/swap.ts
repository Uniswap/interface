import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { atom, WritableAtom } from 'jotai'
import { atomWithImmer } from 'jotai/immer'
import { useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { useMemo } from 'react'

export enum Field {
  INPUT = 'input',
  OUTPUT = 'output',
}

export interface Input {
  value?: number
  token?: Currency
  usdc?: number
}

export interface State {
  activeInput: Field
  [Field.INPUT]: Input & { approved?: boolean }
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

export const stateAtom = atomWithImmer<State>({
  activeInput: Field.INPUT,
  input: { token: nativeOnChain(SupportedChainId.MAINNET) },
  output: {},
})

export const swapAtom = pickAtom(stateAtom, 'swap')

export const inputAtom = atom(
  (get) => get(stateAtom).input,
  (get, set, update: Input & { approved?: boolean }) => {
    set(stateAtom, (state) => {
      state.activeInput = Field.INPUT
      state.input = update
      state.swap = undefined
    })
  }
)

export const outputAtom = atom(
  (get) => get(stateAtom).output,
  (get, set, update: Input) => {
    set(stateAtom, (state) => {
      state.activeInput = Field.OUTPUT
      state.output = update
      state.swap = undefined
    })
  }
)

export function useUpdateInputValue(inputAtom: WritableAtom<Input, Input>) {
  return useUpdateAtom(
    useMemo(
      () => atom(null, (get, set, value: Input['value']) => set(inputAtom, { token: get(inputAtom).token, value })),
      [inputAtom]
    )
  )
}

export function useUpdateInputToken(inputAtom: WritableAtom<Input, Input>) {
  return useUpdateAtom(
    useMemo(() => atom(null, (get, set, token: Input['token']) => set(inputAtom, { token })), [inputAtom])
  )
}

export interface Transaction {
  input: Required<Pick<Input, 'token' | 'value'>>
  output: Required<Pick<Input, 'token' | 'value'>>
  receipt: string
  timestamp: number
  elapsedMs?: number
  status?: true | Error
}

export const transactionAtom = atomWithImmer<Transaction | null>(null)
