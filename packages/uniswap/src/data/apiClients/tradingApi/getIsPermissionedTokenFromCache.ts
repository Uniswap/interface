import type { QueryClient } from '@tanstack/react-query'
import { V1_TRADING_API_PATHS, type CheckPermissionsResponse } from '@universe/api'
import { hasKnownPermissionedToken } from 'uniswap/src/data/apiClients/tradingApi/permissionedTokenStatusCache'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

// Answers "is any of these tokens a permissioned token on this chain?" synchronously, without
// issuing a network request, so the trading API header builder can pick the Universal Router
// version (permissioned pools require a different version than standard pools). Two sources are
// checked: the persistent "known permissioned tokens" cache, which survives reloads so a token
// confirmed permissioned earlier is recognised on the very first quote, and the live
// `/permissions` results populated by `useCheckPermissionsQuery` in the current session.
//
// Fails closed (returns false) when neither source knows yet, the header builder then uses the
// default version, which is correct: we only override when we positively know a token is
// permissioned.
export function getIsPermissionedTokenFromCache({
  queryClient,
  tokenAddresses,
  chainId,
}: {
  queryClient: QueryClient
  tokenAddresses: (string | undefined)[]
  chainId: number | undefined
}): boolean {
  if (!chainId) {
    return false
  }

  const targets = new Set(tokenAddresses.filter((address): address is string => !!address).map((a) => a.toLowerCase()))
  if (targets.size === 0) {
    return false
  }

  // SHORT-TERM: a token previously confirmed permissioned is remembered across reloads,
  // so the first quote can select UR 2.2.0 before the wallet-keyed `/permissions` query resolves.
  // See `permissionedTokenStatusCache`. Falls through to the live results below on a cold cache.
  if (hasKnownPermissionedToken({ queryClient, chainId, tokenAddresses: Array.from(targets) })) {
    return true
  }

  // Prefix match on the `useCheckPermissionsQuery` key: [TradingApi, checkPermissions, params].
  const entries = queryClient.getQueriesData<CheckPermissionsResponse>({
    queryKey: [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.checkPermissions],
  })

  return entries.some(([queryKey, data]) => {
    if (!data || getChainIdFromPermissionsKey(queryKey) !== chainId) {
      return false
    }
    return data.results.some((result) => result.isPermissioned && targets.has(result.token.toLowerCase()))
  })
}

// The query params (with `chainId`) are the third element of the `useCheckPermissionsQuery`
// key. Read defensively since the key is typed only as `unknown[]`.
function getChainIdFromPermissionsKey(queryKey: readonly unknown[]): number | undefined {
  const params = queryKey[2]
  if (typeof params !== 'object' || params === null) {
    return undefined
  }
  const chainId = (params as Record<string, unknown>)['chainId']
  return typeof chainId === 'number' ? chainId : undefined
}
