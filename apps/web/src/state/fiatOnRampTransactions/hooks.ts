import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { FiatOnRampTransactionDetails, addFiatOnRampTransaction } from 'state/fiatOnRampTransactions/reducer'

export function useAddFiatOnRampTransaction() {
  const dispatch = useDispatch()
  return useCallback((payload: FiatOnRampTransactionDetails) => dispatch(addFiatOnRampTransaction(payload)), [dispatch])
}
