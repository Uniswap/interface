import { AnyAction } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import {
  setShowRecipientSelector,
  toggleShowRecipientSelector,
} from 'wallet/src/features/transactions/transactionState/transactionState'

export function useOnToggleShowRecipientSelector(dispatch: React.Dispatch<AnyAction>): () => void {
  return useCallback(() => {
    dispatch(toggleShowRecipientSelector())
  }, [dispatch])
}

export function useSetShowRecipientSelector(
  dispatch: React.Dispatch<AnyAction>
): (show: boolean) => void {
  return useCallback(
    (show: boolean) => {
      dispatch(setShowRecipientSelector(show))
    },
    [dispatch]
  )
}
