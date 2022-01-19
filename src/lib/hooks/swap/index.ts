import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { Field, swapAtom } from 'lib/state/swap'
import { useCallback, useMemo } from 'react'
export { default as useSwapInfo } from './useSwapInfo'

function useCurrencyId(field: Field): [string | undefined, (currencyId: string) => void] {
  const atom = useMemo(() => pickAtom(swapAtom, field), [field])
  const value = useAtomValue(atom).currencyId
  const update = useUpdateAtom(atom)
  const updateCurrencyId = useCallback((currencyId: string) => update({ currencyId }), [update])
  return [value, updateCurrencyId]
}

export function useInputCurrencyId() {
  return useCurrencyId(Field.INPUT)
}

export function useOutputCurrencyId() {
  return useCurrencyId(Field.OUTPUT)
}

function useUpdateCurrencyAmount(field: Field) {
  const update = useUpdateAtom(swapAtom)
  return useCallback(
    (amount: string) =>
      update((swap) => {
        swap.independentField = field
        swap.amount = amount
      }),
    [field, update]
  )
}

export function useUpdateInputCurrencyAmount() {
  return useUpdateCurrencyAmount(Field.INPUT)
}

export function useUpdateOutputCurrencyAmount() {
  return useUpdateCurrencyAmount(Field.OUTPUT)
}

export function useSwitchCurrencies() {
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
