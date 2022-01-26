import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai/immer'
import { pickAtom } from 'lib/state/atoms'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export interface Swap {
  independentField: Field
  readonly amount: string
  readonly [Field.INPUT]?: Currency
  readonly [Field.OUTPUT]?: Currency
}

export const swapAtom = atomWithImmer<Swap>({
  independentField: Field.INPUT,
  amount: '',
  [Field.INPUT]: nativeOnChain(SupportedChainId.MAINNET),
})

export const independentFieldAtom = pickAtom(swapAtom, 'independentField')

// If set to a transaction hash, displays that transaction's status.
export const pendingTxHashAtom = atom<string | undefined>(undefined)
