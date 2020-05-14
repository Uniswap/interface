import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { Field, selectToken, setDefaultsFromURL, switchTokens, typeInput } from './actions'

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

export enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS
}

// updates the swap state to use the defaults for a given network whenever the query
// string updates
export function useDefaultsFromURL(search?: string) {
  const { chainId } = useWeb3React()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    dispatch(setDefaultsFromURL({ chainId, queryString: search }))
  }, [dispatch, search, chainId])
}
