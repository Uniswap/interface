import { useAppSelector } from 'src/app/hooks'
import { AccountStub } from 'src/features/wallet/accounts/types'

export function useAccounts(): Record<string, AccountStub> {
  return useAppSelector((state) => state.wallet.accounts)
}

export function useActiveAccount(): AccountStub | null {
  return useAppSelector((state) => state.wallet.activeAccount)
}
