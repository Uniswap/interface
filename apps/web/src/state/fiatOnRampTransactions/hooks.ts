import { useAccount } from 'hooks/useAccount'
import { useCallback, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { FiatOnRampTransactionDetails, addFiatOnRampTransaction } from 'state/fiatOnRampTransactions/reducer'
import { useAppSelector } from 'state/hooks'

export function useAddFiatOnRampTransaction() {
  const dispatch = useDispatch()
  return useCallback((payload: FiatOnRampTransactionDetails) => dispatch(addFiatOnRampTransaction(payload)), [dispatch])
}

export function useFiatOnRampTransactions() {
  const account = useAccount()
  const fiatOnRampTransactions = useAppSelector((state) => state.fiatOnRampTransactions)
  return useMemo(() => {
    // Only compute the transactions if there's a valid account address
    if (!account.address || !fiatOnRampTransactions[account.address]) {
      return {}
    }
    return fiatOnRampTransactions[account.address]
  }, [account.address, fiatOnRampTransactions])
}
