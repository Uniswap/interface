import { useTrmQuery } from 'wallet/src/features/trm/api'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

interface IsBlockedResult {
  isBlockedLoading: boolean
  isBlocked: boolean
}

/** Returns TRM status for an address that has been passed in. */
export function useIsBlocked(address?: string, isViewOnly = false): IsBlockedResult {
  const { data, loading } = useTrmQuery(isViewOnly ? undefined : address)

  return {
    isBlocked: data?.block || false,
    isBlockedLoading: loading,
  }
}

/** Returns TRM status for the active account. */
export function useIsBlockedActiveAddress(): IsBlockedResult {
  const account = useActiveAccount()
  return useIsBlocked(account?.address, account?.type === AccountType.Readonly)
}
