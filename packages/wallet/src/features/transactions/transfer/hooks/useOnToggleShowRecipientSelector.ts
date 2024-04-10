import { AnyAction } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { toggleShowRecipientSelector } from 'wallet/src/features/transactions/transactionState/transactionState'

export function useOnToggleShowRecipientSelector(dispatch: React.Dispatch<AnyAction>): () => void {
  return useCallback(() => {
    dispatch(toggleShowRecipientSelector())
  }, [dispatch])
}
