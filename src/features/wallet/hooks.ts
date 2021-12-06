import { useAppSelector } from 'src/app/hooks'
import { Account } from 'src/features/wallet/accounts/types'
import { accountsSelector, activeAccountSelector } from 'src/features/wallet/walletSlice'

export function useAccounts() {
  return useAppSelector(accountsSelector)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(activeAccountSelector)
}
