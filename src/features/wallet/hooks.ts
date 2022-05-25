import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { Account } from 'src/features/wallet/accounts/types'
import {
  makeSelectLocalPfp,
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
} from 'src/features/wallet/selectors'

export function useAccounts() {
  return useAppSelector(selectAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(selectActiveAccountAddress)
}

export function useActiveAccountAddressWithThrow(): Address {
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  if (!activeAccountAddress) throw new Error('No active account address')
  return activeAccountAddress
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useAppSelector(selectActiveAccount)
  if (!activeAccount) throw new Error('No active account')
  return activeAccount
}

export function useSelectLocalPfp(address: Address) {
  return useAppSelector(useMemo(() => makeSelectLocalPfp(address), [address]))
}
