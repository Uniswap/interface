import { useTrmQueryResult } from 'src/features/trm/api'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface IsBlockedResult {
  isBlockedLoading: boolean
  isBlocked: boolean
}

/** Returns TRM status for an address that has been passed in. */
export function useIsBlocked(address?: string, isViewOnly = false): IsBlockedResult {
  const { data, isLoading } = useTrmQueryResult(address, isViewOnly)

  return {
    isBlocked: data?.block || false,
    isBlockedLoading: isLoading,
  }
}

/** Returns TRM status for the active account. */
export function useIsBlockedActiveAddress(): IsBlockedResult {
  const account = useActiveAccount()
  return useIsBlocked(account?.address, account?.type === AccountType.Readonly)
}
