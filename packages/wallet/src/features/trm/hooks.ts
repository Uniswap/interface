import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useRestQuery } from 'uniswap/src/data/rest'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

type ScreenResponse = {
  block: boolean
}
interface IsBlockedResult {
  isBlockedLoading: boolean
  isBlocked: boolean
}

/** Returns TRM status for an address that has been passed in. */
export function useIsBlocked(address?: string, isViewOnly = false): IsBlockedResult {
  const { data, loading } = useRestQuery<ScreenResponse, { address?: string }>(
    uniswapUrls.trmPath,
    { address },
    ['block'],
    {
      ttlMs: ONE_MINUTE_MS * 5,
      skip: !address || isViewOnly,
    }
  )

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
