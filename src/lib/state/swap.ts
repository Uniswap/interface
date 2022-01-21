import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { atom } from 'jotai'
import { atomWithImmer } from 'jotai/immer'
import { SwapProps } from 'lib/components/Swap'
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
  integratorFee?: number
}
export const swapAtom = atomWithImmer<Swap>({
  independentField: Field.INPUT,
  amount: '',
  [Field.INPUT]: nativeOnChain(SupportedChainId.MAINNET),
})

type SwapDefaults = Pick<
  SwapProps,
  'defaultInputAddress' | 'defaultInputAmount' | 'defaultOutputAddress' | 'defaultOutputAmount'
>

export const swapDefaultsAtom = atom<SwapDefaults>({})

export const independentFieldAtom = pickAtom(swapAtom, 'independentField')
export const integratorFeeAtom = pickAtom(swapAtom, 'integratorFee')
export const amountAtom = pickAtom(swapAtom, 'amount')

export interface SwapTransaction {
  input: CurrencyAmount<Currency>
  output: CurrencyAmount<Currency>
  receipt: string
  timestamp: number
  elapsedMs?: number
  status?: true | Error
}

export const swapTransactionAtom = atomWithImmer<SwapTransaction | null>(null)
