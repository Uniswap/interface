import { useQuery } from '@tanstack/react-query'
import type { GetEarnPositionResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { getEarnPositionQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/earn'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfo } from 'uniswap/src/features/earn/utils'

interface UseEarnPositionParams {
  vault: Pick<EarnVaultInfo, 'vaultAddress' | 'chainId'> | null | undefined
  walletAddress: string | undefined
  isConnected: boolean
  enabled?: boolean
  /** Fallback while the live query is pending — typically from a prefetched ListEarnPositions. */
  prefetchedPosition?: EarnPositionInfo
}

interface UseEarnPositionResult {
  /** Authoritative "is a position available?" signal — undefined on disconnect/error/pending. */
  position: EarnPositionInfo | undefined
  /** Tracks the underlying query, not `position` (which is undefined on the disconnect path). */
  isSuccess: boolean
  isError: boolean
  isLoading: boolean
}

// Module-level so React Query keeps a stable reference across renders.
const selectEarnPosition = (data: GetEarnPositionResponse | undefined): EarnPositionInfo | undefined =>
  getEarnPositionInfo(data?.position)

export function useEarnPosition({
  vault,
  walletAddress,
  isConnected,
  enabled = true,
  prefetchedPosition,
}: UseEarnPositionParams): UseEarnPositionResult {
  const params = useMemo(
    () =>
      vault && walletAddress ? { walletAddress, vaultAddress: vault.vaultAddress, chainId: vault.chainId } : undefined,
    [vault, walletAddress],
  )

  const query = useQuery(
    getEarnPositionQueryOptions({
      params,
      enabled: enabled && !!params,
      select: selectEarnPosition,
    }),
  )

  // Disconnect → undefined so prefetched data doesn't carry across wallet sessions.
  // Placeholder data is treated as pending so consumers don't flash optimistic results.
  const position = !isConnected
    ? undefined
    : query.isError
      ? undefined
      : query.isSuccess && !query.isPlaceholderData
        ? query.data
        : prefetchedPosition

  return {
    position,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isLoading: query.isLoading,
  }
}
