import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, AppState } from '../index'
import { Field, typeInput } from './actions'

export function useCalculatorState(): AppState['calculator'] {
  return useSelector<AppState, AppState['calculator']>(state => state.calculator)
}

export function useCalculatorActionHandlers(): {
  onStakedCroAmountInput: (typedValue: string) => void
  onLiquidityProvidedUsdAmount: (typedValue: string) => void
  onStakeYear: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onLiquidityProvidedUsdAmount = useCallback(
    (typedValue: string) => {
      if (!typedValue || typedValue.match(/^\d{1,12}(\.\d{0,2})?$/)) {
        dispatch(typeInput({ field: Field.TOTAL_LIQUIDITY_PROVIDED_USD, typedValue }))
      }
    },
    [dispatch]
  )
  const onStakedCroAmountInput = useCallback(
    (typedValue: string) => {
      if (!typedValue || typedValue.match(/^\d{1,12}(\.\d{0,18})?$/)) {
        dispatch(typeInput({ field: Field.TOTAL_STAKED_AMOUNT_CRO, typedValue }))
      }
    },
    [dispatch]
  )
  const onStakeYear = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.STAKE_YEAR, typedValue }))
    },
    [dispatch]
  )

  return {
    onStakedCroAmountInput,
    onLiquidityProvidedUsdAmount,
    onStakeYear
  }
}
