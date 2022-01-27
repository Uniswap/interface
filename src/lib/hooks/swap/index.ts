import { Currency } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { Field, independentFieldAtom, swapAtom } from 'lib/state/swap'
import { useCallback, useMemo } from 'react'
export { default as useSwapInfo } from './useSwapInfo'

export const amountAtom = pickAtom(swapAtom, 'amount')

function otherField(field: Field) {
  switch (field) {
    case Field.INPUT:
      return Field.OUTPUT
      break
    case Field.OUTPUT:
      return Field.INPUT
      break
  }
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

export function useSwapCurrency(field: Field): [Currency | undefined, (currency?: Currency) => void] {
  const atom = useMemo(() => pickAtom(swapAtom, field), [field])
  const otherAtom = useMemo(() => pickAtom(swapAtom, otherField(field)), [field])
  const [currency, setCurrency] = useAtom(atom)
  const otherCurrency = useAtomValue(otherAtom)
  const switchSwapCurrencies = useSwitchSwapCurrencies()
  const setOrSwitchCurrency = useCallback(
    (currency?: Currency) => {
      if (currency === otherCurrency) {
        switchSwapCurrencies()
      } else {
        setCurrency(currency)
      }
    },
    [otherCurrency, setCurrency, switchSwapCurrencies]
  )
  return [currency, setOrSwitchCurrency]
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
