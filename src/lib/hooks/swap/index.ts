import { Currency } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { amountAtom, Field, independentFieldAtom, swapAtom } from 'lib/state/swap'
import { useCallback, useMemo } from 'react'
export { default as useSwapInfo } from './useSwapInfo'

export function useSwapCurrency(field: Field): [Currency | undefined, (currency?: Currency) => void] {
  const atom = useMemo(() => pickAtom(swapAtom, field), [field])
  return useAtom(atom)
}

export function useSwapAmount(field: Field): [string | undefined, (amount: string) => void] {
  const amount = useAtomValue(amountAtom)
  const independentField = useAtomValue(independentFieldAtom)
  const value = useMemo(() => (independentField === field ? amount : undefined), [amount, independentField, field])
  const updateSwap = useUpdateAtom(swapAtom)
  const updateAmount = useCallback(
    (amount: string) =>
      updateSwap((swap) => {
        swap.independentField = field
        swap.amount = amount
      }),
    [field, updateSwap]
  )
  return [value, updateAmount]
}

export function useSwitchSwapCurrencies() {
  const update = useUpdateAtom(swapAtom)
  return useCallback(() => {
    update((swap) => {
      const oldOutput = swap[Field.OUTPUT]
      swap[Field.OUTPUT] = swap[Field.INPUT]
      swap[Field.INPUT] = oldOutput
      switch (swap.independentField) {
        case Field.INPUT:
          swap.independentField = Field.OUTPUT
          break
        case Field.OUTPUT:
          swap.independentField = Field.INPUT
          break
      }
    })
  }, [update])
}
