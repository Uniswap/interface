import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { pickAtom } from 'lib/state/atoms'
import { Field, swapAtom } from 'lib/state/swap'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useMemo } from 'react'
export { default as useSwapInfo } from './useSwapInfo'

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

const independentFieldAtom = pickAtom(swapAtom, 'independentField')

export function useIsSwapFieldIndependent(field: Field): boolean {
  const independentField = useAtomValue(independentFieldAtom)
  return independentField === field
}

export function useSwapTradeType(): TradeType {
  const independentField = useAtomValue(independentFieldAtom)
  switch (independentField) {
    case Field.INPUT:
      return TradeType.EXACT_INPUT
    case Field.OUTPUT:
      return TradeType.EXACT_OUTPUT
  }
}

const amountAtom = pickAtom(swapAtom, 'amount')

// check if any amount has been entered by user
export function useIsAmountPopulated() {
  return Boolean(useAtomValue(amountAtom))
}

export function useSwapAmount(field: Field): [string | undefined, (amount: string) => void] {
  const amount = useAtomValue(amountAtom)
  const isFieldIndependent = useIsSwapFieldIndependent(field)
  const value = useMemo(() => (isFieldIndependent ? amount : undefined), [amount, isFieldIndependent])
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

export function useSwapCurrencyAmount(field: Field): CurrencyAmount<Currency> | undefined {
  const isFieldIndependent = useIsSwapFieldIndependent(field)
  const isAmountPopulated = useIsAmountPopulated()
  const [swapAmount] = useSwapAmount(field)
  const [swapCurrency] = useSwapCurrency(field)
  if (isFieldIndependent && isAmountPopulated) {
    return tryParseCurrencyAmount(swapAmount, swapCurrency)
  }
  return
}
