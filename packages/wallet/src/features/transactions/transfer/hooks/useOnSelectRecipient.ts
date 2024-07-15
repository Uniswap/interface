import { AnyAction } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { selectRecipient } from 'wallet/src/features/transactions/transactionState/transactionState'
import { useOnToggleShowRecipientSelector } from 'wallet/src/features/transactions/transfer/hooks/useOnToggleShowRecipientSelector'

export function useOnSelectRecipient(
  dispatch: React.Dispatch<AnyAction>
): (recipient: Address) => void {
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)
  return useCallback(
    (recipient: Address) => {
      onToggleShowRecipientSelector()
      dispatch(selectRecipient({ recipient }))
    },
    [dispatch, onToggleShowRecipientSelector]
  )
}
