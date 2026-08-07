import type { QueryClient } from '@tanstack/react-query'
import type { CheckPermissionsResult } from '@universe/api'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

// SHORT-TERM: this whole feature can be deleted once the router version no longer depends
// on whether a token is permissioned, i.e. when `getUniversalRouterVersionHeader` in
// `TradingApiClient` stops branching on permissioned status (every quote on UR 2.2.0). Teardown
// sites: this module, its read in `getIsPermissionedTokenFromCache`, its seed in
// `useCheckPermissionsQuery`, the `setQueryDefaults` registration in `SharedQueryClient`, and the
// `PermissionedTokenStatus` key in `ReactQueryCacheKey`. This file is the single source of truth for
// the removal trigger; the other SHORT-TERM markers point here.
//
// Until then: the trading-API header builder runs synchronously when a quote fires, so it can't
// await `/permissions`. On a cold form the wallet-keyed `/permissions` cache hasn't resolved yet,
// so the first quote for a permissioned token would ship the default 2.0/2.1.1 header and fail
// until a later poll. We avoid that by remembering confirmed-permissioned tokens here, keyed by
// (chainId, token), persisted across reloads (see the `meta.persist` default registered on
// `SharedQueryClient`). Once a token is confirmed permissioned it stays permissioned (monotonic),
// so a cached positive never goes stale and the first quote after the very first lookup can use
// 2.2.0 with no round trip.
//
// We persist positives only. Caching "not permissioned" forever could mask a token that becomes
// permissioned later; absence simply falls back to the live `/permissions` results, which is the
// existing behaviour. So this cache is a monotonic "tokens we've confirmed are permissioned" set.

function permissionedTokenStatusKey(chainId: number, tokenAddress: string): [ReactQueryCacheKey, number, string] {
  return [ReactQueryCacheKey.PermissionedTokenStatus, chainId, tokenAddress.toLowerCase()]
}

/**
 * Records every confirmed-permissioned token from a `/permissions` response into the persistent
 * per-token cache. Positives only; non-permissioned results are intentionally left unwritten.
 */
export function seedKnownPermissionedTokens({
  queryClient,
  chainId,
  results,
}: {
  queryClient: QueryClient
  chainId: number
  results: CheckPermissionsResult[]
}): void {
  for (const result of results) {
    if (result.isPermissioned) {
      queryClient.setQueryData<boolean>(permissionedTokenStatusKey(chainId, result.token), true)
    }
  }
}

/** Returns true if any of the given tokens was previously confirmed permissioned on this chain. */
export function hasKnownPermissionedToken({
  queryClient,
  chainId,
  tokenAddresses,
}: {
  queryClient: QueryClient
  chainId: number
  tokenAddresses: (string | undefined)[]
}): boolean {
  return tokenAddresses.some(
    (address) => !!address && queryClient.getQueryData<boolean>(permissionedTokenStatusKey(chainId, address)) === true,
  )
}
