import { useAppSelector } from 'src/app/hooks'
import { Account } from 'src/features/wallet/accounts/types'
import {
  accountsSelector,
  activeAccountAddressSelector,
  activeAccountSelector,
} from 'src/features/wallet/walletSlice'

export function useAccounts() {
  return useAppSelector(accountsSelector)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(activeAccountSelector)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(activeAccountAddressSelector)
}

export function useActiveAccountAddressWithThrow(): Address {
  const activeAccountAddress = useAppSelector(activeAccountAddressSelector)
  if (!activeAccountAddress) throw new Error('No active account address')
  return activeAccountAddress
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useAppSelector(activeAccountSelector)
  if (!activeAccount) throw new Error('No active account')
  return activeAccount
}
