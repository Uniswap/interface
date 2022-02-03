import { Currency } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
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
  amount: string
  [Field.INPUT]?: Currency
  [Field.OUTPUT]?: Currency
}

export const swapAtom = atomWithImmer<Swap>({
  independentField: Field.INPUT,
  amount: '',
  [Field.INPUT]: nativeOnChain(SupportedChainId.MAINNET),
})

export const independentFieldAtom = pickAtom(swapAtom, 'independentField')

// If set to a transaction hash, that transaction will display in a status dialog.
export const displayTxHashAtom = atom<string | undefined>(undefined)

export const feeOptionsAtom = atom<FeeOptions | undefined>(undefined)
