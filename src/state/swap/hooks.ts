import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { Field, selectToken, switchTokens, typeInput } from './actions'

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap)
}

export function useSwapActionHandlers(): {
  onTokenSelection: (field: Field, address: string) => void
  onSwapTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onMaxInput: (typedValue: string) => void
  onMaxOutput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()
  const onTokenSelection = useCallback(
    (field: Field, address: string) => {
      dispatch(
        selectToken({
          field,
          address
        })
      )
    },
    [dispatch]
  )

  const onSwapTokens = useCallback(() => {
    dispatch(switchTokens())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onMaxInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  const onMaxOutput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.OUTPUT, typedValue }))
    },
    [dispatch]
  )

  return {
    onMaxInput,
    onMaxOutput,
    onSwapTokens,
    onTokenSelection,
    onUserInput
  }
}
