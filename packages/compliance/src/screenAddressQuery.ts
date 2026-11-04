import { skipToken, useQuery } from '@tanstack/react-query'
import { type ScreenAddressInput, screenAddress } from '@universe/compliance/src/client'
import { useComplianceClient } from '@universe/compliance/src/useComplianceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = ONE_MINUTE_MS * 5

/**
 * Screens a wallet address against the compliance provider and reports whether it
 * should be blocked (e.g. sanctioned / OFAC-listed). Pass `undefined` to skip the
 * query (no address yet, or a view-only account you don't screen).
 *
 * A gateway wallet block (403 with a `walletBlocked` `ComplianceBlock` detail)
 * and the compliancev2 200 `{ block: true }` both resolve to `isBlocked: true`,
 * without retrying (see `screenAddress`).
 *
 * Otherwise fails open: `isBlocked` is `false` while the call is loading, on any
 * other error, and for unauthenticated callers — never read `false` as a
 * verified-clean signal. Gate the
 * action on `isBlocked || isBlockedLoading` at the call site if you need
 * fail-closed-while-pending.
 */
export function useIsBlockedAddress(input: ScreenAddressInput | undefined): {
  isBlocked: boolean
  isBlockedLoading: boolean
} {
  const client = useComplianceClient()
  const { data, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.Compliance, 'screenAddress', input?.chainId, input?.address],
    queryFn: input ? () => screenAddress(client, input) : skipToken,
    staleTime: FIVE_MINUTES_MS,
  })
  return {
    isBlocked: data ?? false,
    isBlockedLoading: isLoading,
  }
}
