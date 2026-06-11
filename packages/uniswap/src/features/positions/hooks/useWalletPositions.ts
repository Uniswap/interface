import { ConnectError } from '@connectrpc/connect'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { ListPositionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useEffect, useMemo } from 'react'
import { useGetPositionsInfiniteQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { parseRestPosition } from 'uniswap/src/features/positions/parseRestPosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'

const DEFAULT_PROTOCOL_VERSIONS: ProtocolVersion[] = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
const DEFAULT_STATUSES: PositionStatus[] = [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE]
const DEFAULT_PAGE_SIZE = 25

export interface UseWalletPositionsParams {
  account: string
  /** Optional chain filter - if omitted, fetches across all enabled chains. */
  chainIds?: UniverseChainId[]
  protocolVersions?: ProtocolVersion[]
  statuses?: PositionStatus[]
  /** Whether the BE should include positions the user has marked hidden. Defaults to false. */
  includeHidden?: boolean
  /**
   * When true (default), follows `nextPageToken` until exhausted so the returned arrays
   * represent ALL of the wallet's positions. When false, only the first page is returned -
   * useful for previews (e.g. Portfolio Overview MiniTable showing top N) or for surfaces
   * that drive their own load-more UX (e.g. infinite-scroll sentinels on the Pools page).
   */
  autoFetchAllPages?: boolean
  pageSize?: number
  /**
   * When true, this observer is disabled and won't drive a fetch (forwarded to the query's
   * `enabled`). Callers compose this from whatever precondition should gate the query. Note:
   * if another mounted observer shares the same query key and is enabled, the underlying query
   * can still fetch. Defaults to false.
   */
  disabled?: boolean
  /**
   * Optional polling interval (ms). When set, the query refetches on this interval; a refetch
   * re-fetches all currently-loaded pages. Polling only runs while the query is enabled and the
   * document is foreground. Defaults to undefined (no polling) — preserving existing web behavior.
   */
  pollInterval?: number
}

type ForwardedQueryState = Pick<
  UseInfiniteQueryResult<InfiniteData<ListPositionsResponse>, ConnectError>,
  | 'isLoading'
  | 'isFetching'
  | 'isFetchingNextPage'
  | 'isPlaceholderData'
  | 'hasNextPage'
  | 'error'
  | 'refetch'
  | 'fetchNextPage'
>

export interface UseWalletPositionsResult extends ForwardedQueryState {
  /** Positions visible to the wallet after applying the Redux visibility check. */
  positions: PositionInfo[]
  /**
   * Positions the Redux visibility check classifies as hidden. Note this can be non-empty
   * even with `includeHidden=false` if the visibility selector flags a server-returned
   * position as hidden client-side.
   */
  hiddenPositions: PositionInfo[]
  /** All parsed positions (visible + hidden), useful for total counts. */
  allPositions: PositionInfo[]
  /**
   * True once the first page response has been received (success or empty).
   * Useful for distinguishing "still loading" from "errored before any data arrived".
   */
  hasData: boolean
}

/**
 * Shared hook for fetching, parsing, and partitioning a wallet's liquidity positions.
 * Wraps `useGetPositionsInfiniteQuery` and auto-drains pages by default so consumers see
 * the wallet's complete position set without managing pagination themselves.
 */
export function useWalletPositions({
  account,
  chainIds,
  protocolVersions = DEFAULT_PROTOCOL_VERSIONS,
  statuses = DEFAULT_STATUSES,
  includeHidden = false,
  autoFetchAllPages = true,
  pageSize = DEFAULT_PAGE_SIZE,
  disabled = false,
  pollInterval,
}: UseWalletPositionsParams): UseWalletPositionsResult {
  const { chains: defaultChains } = useEnabledChains()
  const isPositionVisible = usePositionVisibilityCheck()

  const skipQuery = !account || disabled

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useGetPositionsInfiniteQuery(
    {
      address: account,
      chainIds: chainIds ?? defaultChains,
      positionStatuses: statuses,
      protocolVersions,
      pageSize,
      pageToken: '',
      includeHidden,
    },
    { disabled: skipQuery, refetchInterval: pollInterval },
  )

  // Auto-drain pages: keep firing fetchNextPage until hasNextPage flips false.
  // Guarded against retry loops: if the last fetch errored, stop until the consumer
  // refetches; if any fetch is in flight, wait for it to settle before queueing another.
  useEffect(() => {
    if (!autoFetchAllPages || skipQuery) {
      return
    }
    if (error) {
      return
    }
    if (hasNextPage && !isFetchingNextPage && !isFetching) {
      fetchNextPage().catch(() => {
        // Swallow - React Query surfaces errors via the query state; the error guard
        // above prevents this effect from re-firing into a failing endpoint.
      })
    }
  }, [autoFetchAllPages, skipQuery, hasNextPage, isFetchingNextPage, isFetching, error, fetchNextPage])

  const { positions, hiddenPositions, allPositions } = useMemo(() => {
    const visible: PositionInfo[] = []
    const hidden: PositionInfo[] = []
    const all: PositionInfo[] = []

    const restPositions = data?.pages.flatMap((page) => page.positions) ?? []
    for (const restPosition of restPositions) {
      const parsed = parseRestPosition(restPosition)
      if (!parsed) {
        continue
      }
      all.push(parsed)
      const isVisible = isPositionVisible({
        poolId: parsed.poolId,
        tokenId: parsed.tokenId,
        chainId: parsed.chainId,
        isFlaggedSpam: parsed.isHidden,
      })
      if (isVisible) {
        visible.push(parsed)
      } else {
        hidden.push(parsed)
      }
    }

    return { positions: visible, hiddenPositions: hidden, allPositions: all }
  }, [data?.pages, isPositionVisible])

  return {
    positions,
    hiddenPositions,
    allPositions,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    hasNextPage,
    hasData: data !== undefined,
    error,
    refetch,
    fetchNextPage,
  }
}
