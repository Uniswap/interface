import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useAppSelector } from 'wallet/src/state'
import {
  makeSelectAccountNotificationSetting,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectNonPendingSignerAccounts,
  selectPendingAccounts,
  selectSignerAccounts,
  selectSignerMnemonicAccountExists,
  selectViewOnlyAccounts,
} from './selectors'

export function useAccounts(): Record<string, Account> {
  return useAppSelector<Record<string, Account>>(selectNonPendingAccounts)
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector<AddressTo<Account>>(selectPendingAccounts)
}

export function useSignerAccounts(): Account[] {
  return useAppSelector<Account[]>(selectSignerAccounts)
}

export function useNonPendingSignerAccounts(): Account[] {
  return useAppSelector<Account[]>(selectNonPendingSignerAccounts)
}

export function useViewOnlyAccounts(): Account[] {
  return useAppSelector<Account[]>(selectViewOnlyAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(selectActiveAccountAddress)
}

export function useNativeAccountExists(): boolean {
  return useAppSelector(selectSignerMnemonicAccountExists)
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

export function useSelectAccountNotificationSetting(address: Address): boolean {
  return useAppSelector(makeSelectAccountNotificationSetting(address))
}
