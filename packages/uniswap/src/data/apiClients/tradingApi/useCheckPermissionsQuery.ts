import { skipToken, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import {
  FetchError,
  V1_TRADING_API_PATHS,
  type CheckPermissionsRequest,
  type CheckPermissionsResponse,
  type UseQueryApiHelperHookArgs,
} from '@universe/api'
import { seedKnownPermissionedTokens } from 'uniswap/src/data/apiClients/tradingApi/permissionedTokenStatusCache'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const STALE_TIME_MS = 300_000

export function useCheckPermissionsQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  CheckPermissionsRequest,
  CheckPermissionsResponse
>): UseQueryResult<CheckPermissionsResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.checkPermissions, params]
  const queryClient = useQueryClient()

  return useQuery({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchCheckPermissions> => {
          try {
            const response = await TradingApiClient.fetchCheckPermissions(params)
            try {
              // SHORT-TERM: remember confirmed-permissioned tokens so the first quote
              // after a reload uses Universal Router 2.2.0. See `permissionedTokenStatusCache`.
              seedKnownPermissionedTokens({ queryClient, chainId: params.chainId, results: response.results })
            } catch (seedError) {
              // Best-effort cache write: a seed failure must not turn a successful fetch into a failure.
              logger.warn(
                'useCheckPermissionsQuery',
                'seedKnownPermissionedTokens',
                'Failed to cache permissioned-token status',
                {
                  error: seedError,
                  chainId: params.chainId,
                },
              )
            }
            return response
          } catch (error) {
            logger.warn('useCheckPermissionsQuery', 'queryFn', 'TAPI CheckPermissions failed', {
              error,
              chainId: params.chainId,
            })
            throw error
          }
        }
      : skipToken,
    staleTime: STALE_TIME_MS,
    // Retry once on transient errors (5xx); never retry on 4xx (the response is authoritative).
    // Network errors (no response) are intentionally NOT retried — the upstream hook fails open
    // when the API doesn't answer, so a longer offline window is preferable to repeated retries
    // that delay the fail-open path. Telemetry catches the failure via the queryFn-level warn.
    retry: (failureCount, error): boolean => {
      if (failureCount >= 1) {
        return false
      }
      if (error instanceof FetchError && error.response.status >= 500) {
        return true
      }
      return false
    },
    ...rest,
  })
}
