import {
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectPendingAccounts,
  selectSignerAccounts,
} from 'wallet/src/features/wallet/selectors'
import { Account } from 'wallet/src/features/wallet/types'
import { useAppSelector } from 'wallet/src/state'

export function useAccounts(): Record<string, Account> {
  return useAppSelector<Record<string, Account>>(selectNonPendingAccounts)
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector<AddressTo<Account>>(selectPendingAccounts)
}

export function useSignerAccounts(): Account[] {
  return useAppSelector<Account[]>(selectSignerAccounts)
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
