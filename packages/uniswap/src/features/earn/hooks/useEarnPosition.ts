import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { GetEarnPositionResponse, ListEarnPositionsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useEffect, useMemo } from 'react'
import {
  getEarnPositionQueryOptions,
  getListEarnPositionsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/earn/queries'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import {
  applyOptimisticEarnPositionUpdate,
  useOptimisticEarnPositionStore,
} from 'uniswap/src/features/earn/optimisticEarnPositions'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfo, getEarnPositionInfosByVaultId } from 'uniswap/src/features/earn/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

interface UseEarnPositionParams {
  vault:
    | (Pick<EarnVaultInfo, 'vaultAddress' | 'chainId'> & Partial<Pick<EarnVaultInfo, 'apyPercent' | 'id'>>)
    | null
    | undefined
  walletAddress: string | undefined
  isConnected: boolean
  enabled?: boolean
  /** Fallback while the live query is pending — typically from a prefetched ListEarnPositions. */
  prefetchedPosition?: EarnPositionInfo
}

export enum EarnPositionStatus {
  Present = 'present',
  NoPosition = 'noPosition',
  Loading = 'loading',
  Error = 'error',
}

interface UseEarnPositionResult {
  /** Authoritative "is a position available?" signal — undefined on disconnect/error/pending. */
  position: EarnPositionInfo | undefined
  /** `error` and `loading` mean unknown, not confirmed no-position. */
  positionStatus: EarnPositionStatus
  /** Tracks the underlying query, not `position` (which is undefined on the disconnect path). */
  isSuccess: boolean
  isError: boolean
  isLoading: boolean
  /** Refetches the underlying position query. */
  refetch: () => void
}

// Module-level so React Query keeps a stable reference across renders.
const selectEarnPosition = (data: PlainMessage<GetEarnPositionResponse> | undefined): EarnPositionInfo | undefined =>
  getEarnPositionInfo(data?.position)

const selectEarnPositionsByVaultId = (
  data: PlainMessage<ListEarnPositionsResponse> | undefined,
): ReadonlyMap<string, EarnPositionInfo> => getEarnPositionInfosByVaultId(data?.positions)

export function useEarnPosition({
  vault,
  walletAddress,
  isConnected,
  enabled = true,
  prefetchedPosition,
}: UseEarnPositionParams): UseEarnPositionResult {
  const queryClient = useQueryClient()
  const params = useMemo(
    () =>
      vault && walletAddress
        ? {
            walletAddress,
            vaultAddress: vault.vaultAddress,
            chainId: vault.chainId,
          }
        : undefined,
    [vault, walletAddress],
  )

  const query = useQuery(
    getEarnPositionQueryOptions({
      params,
      enabled: enabled && !!params,
      select: selectEarnPosition,
    }),
  )

  // Read cached ListEarnPositions data so returning users do not briefly see the deposit-only state.
  const listPositionsParams = useMemo(
    () => (walletAddress ? { walletAddress, chainIds: [...EARN_SUPPORTED_CHAIN_IDS] } : undefined),
    [walletAddress],
  )
  const cachedPositionsQuery = useQuery(
    getListEarnPositionsQueryOptions({
      params: listPositionsParams,
      enabled: false,
      select: selectEarnPositionsByVaultId,
    }),
  )
  // Placeholder data can belong to the previous wallet.
  const cachedPositionsResolved = cachedPositionsQuery.isSuccess && !cachedPositionsQuery.isPlaceholderData
  const cachedPosition = cachedPositionsResolved && vault?.id ? cachedPositionsQuery.data.get(vault.id) : undefined

  const optimisticEarnPositionUpdates = useOptimisticEarnPositionStore((s) => s.updatesById)

  // Keep known hints while the live query is pending/errored.
  const hintPosition = prefetchedPosition ?? cachedPosition
  const apiPosition = !isConnected ? undefined : query.isSuccess && !query.isPlaceholderData ? query.data : hintPosition

  useEffect(() => {
    if (!query.isSuccess || query.isPlaceholderData || !params) {
      return
    }

    queryClient
      .invalidateQueries({
        queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
      })
      .catch(() => undefined)
  }, [params, query.isPlaceholderData, query.isSuccess, queryClient])

  const position = useMemo(
    () =>
      applyOptimisticEarnPositionUpdate({
        chainIds: vault ? [vault.chainId] : undefined,
        position: apiPosition,
        updatesById: optimisticEarnPositionUpdates,
        vault: vault ?? undefined,
        walletAddress: isConnected ? walletAddress : undefined,
      }),
    [apiPosition, isConnected, optimisticEarnPositionUpdates, vault, walletAddress],
  )

  // A failed lookup is unknown, never confirmed no-position.
  const positionStatus: EarnPositionStatus = !isConnected
    ? EarnPositionStatus.NoPosition
    : position !== undefined
      ? EarnPositionStatus.Present
      : query.isSuccess || cachedPositionsResolved
        ? EarnPositionStatus.NoPosition
        : query.isError
          ? EarnPositionStatus.Error
          : EarnPositionStatus.Loading

  return {
    position,
    positionStatus,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isLoading: query.isLoading,
    refetch: () => {
      query.refetch().catch(() => undefined)
    },
  }
}
