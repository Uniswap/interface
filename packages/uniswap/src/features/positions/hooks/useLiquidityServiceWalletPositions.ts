import type { PartialMessage } from '@bufbuild/protobuf'
import type { InfiniteData } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { ChainId, Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import type {
  PositionModifier,
  PositionSortBy,
  PositionStatus as LiquidityPositionStatus,
  RangeStatus,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { useCallback, useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import type { GetWalletPositions } from 'uniswap/src/data/apiClients/liquidityService/queries/positionQueries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAutoDrainPages } from 'uniswap/src/features/positions/hooks/useAutoDrainPages'
import type {
  UseWalletPositionsParams,
  UseWalletPositionsResult,
} from 'uniswap/src/features/positions/hooks/useWalletPositions'
import { parseLiquidityServicePosition } from 'uniswap/src/features/positions/parseLiquidityServicePosition'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import {
  getPositionKey,
  protocolVersionToLiquidityServiceProtocols,
  toLiquidityChainId,
} from 'uniswap/src/features/positions/utils'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'

/**
 * `useWalletPositions` data source backed by the liquidity-service `GetWalletPositions` endpoint.
 *
 * The endpoint returns self-contained positions: the backend enriches each with token identity
 * (token0/1 address + metadata) and pool current state (currentTick/sqrtPrice/liquidity/hooks), so
 * positions map straight into `PositionInfo` with no `GetPools` join and never drop for lack of a
 * fresh USD price.
 *
 * Filtering is server-side: `requestStatuses` (OPEN/CLOSED lifecycle), `rangeStatuses`
 * (in/out-of-range), and `modifier` (spam visibility + per-pool overrides) are sent on the request,
 * so the backend decides the returned set. The Redux visibility check then only styles which of the
 * returned positions render as hidden.
 */
export function useLiquidityServiceWalletPositions({
  account,
  chainIds,
  protocolVersions,
  requestStatuses,
  rangeStatuses,
  modifier,
  sortBy,
  ascending,
  search,
  autoFetchAllPages = true,
  pageSize,
  disabled = false,
  pollInterval,
}: UseWalletPositionsParams & {
  protocolVersions: ProtocolVersion[]
  // Liquidity-service statuses sent straight to the request. Lifecycle only (OPEN/CLOSED); spam
  // visibility is not a status — it's controlled by `modifier`.
  requestStatuses: LiquidityPositionStatus[]
  // Server-side in/out-of-range refinement, sent alongside `statuses` as the request's range filter.
  rangeStatuses?: RangeStatus[]
  // Client-supplied spam-visibility + per-pool include/exclude overrides. Backend uses it to decide
  // which positions are returned, so the toggle drives a refetch rather than a client-side filter.
  modifier?: PartialMessage<PositionModifier>
  // Server-side sort. CREATED_AT/DISTRIBUTION/LIQUIDITY (USD value) order server-side today;
  // FEES/APR are accepted but currently no-op on the backend.
  sortBy?: PositionSortBy
  ascending?: boolean
  // Server-side search over token symbol/name, token address, and pool address/id. Sent on the
  // request so the backend returns the matching set; an empty/whitespace value is omitted so it
  // shares the unfiltered query key rather than caching separately.
  search?: string
  pageSize: number
}): UseWalletPositionsResult {
  const { chains: defaultChains } = useEnabledChains()
  const isPositionVisible = usePositionVisibilityCheck()

  const skipQuery = !account || disabled

  const versions = useMemo(() => {
    const mapped: Protocols[] = []
    for (const version of protocolVersions) {
      const protocol = protocolVersionToLiquidityServiceProtocols(version)
      if (protocol !== undefined) {
        mapped.push(protocol)
      }
    }
    return mapped
  }, [protocolVersions])
  const requestChainIds = useMemo(
    () => (chainIds ?? defaultChains).map(toLiquidityChainId).filter((id): id is ChainId => id !== undefined),
    [chainIds, defaultChains],
  )
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
  } = useInfiniteQuery({
    ...liquidityQueries.getWalletPositions({
      params: {
        walletAddress: account,
        chainIds: requestChainIds,
        versions,
        statuses: requestStatuses,
        rangeStatuses: rangeStatuses ?? [],
        modifier,
        limit: pageSize,
        sortBy,
        ascending,
        search: search?.trim() ? search.trim() : undefined,
      },
      enabled: !skipQuery,
    }),
    refetchInterval: pollInterval,
    // Keep the previous results visible while a status/sort/range change refetches, so the table
    // swaps in the reordered rows in place instead of dropping to a loading state. Scope this to the
    // SAME wallet: TanStack applies placeholderData whenever data is undefined without consulting
    // `enabled`, so on a wallet switch or disconnect an unscoped keepPreviousData would keep showing
    // the prior wallet's positions and never fall through to the disconnected/empty state.
    placeholderData: (previousData, previousQuery) => {
      if (skipQuery) {
        return undefined
      }
      const previousWallet = previousQuery?.queryKey[2]?.walletAddress
      return previousWallet === account ? previousData : undefined
    },
  })

  // TanStack's refetch() fetches unconditionally — it never consults `enabled` — so a consumer
  // refetching while the wallet address is still unavailable sends GetWalletPositions with an empty
  // walletAddress, which the service rejects with a 400. Gate it on the same predicate as `enabled`.
  const gatedRefetch = useCallback(() => {
    if (skipQuery) {
      return
    }
    // The result contract types refetch as returning void, so the query's promise is discarded
    // here; errors surface through the query's own error state.
    void refetch()
  }, [skipQuery, refetch])

  useAutoDrainPages({
    enabled: autoFetchAllPages && !skipQuery,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    error,
    fetchNextPage,
  })

  // persistableInfiniteQueryOptions erases the InfiniteData wrapper from the inferred data type;
  // restore it explicitly (same approach as the listPools consumers).
  const infiniteData = data as InfiniteData<GetWalletPositions> | undefined

  const { positions, hiddenPositions, allPositions } = useMemo(() => {
    const visible: PositionInfo[] = []
    const hidden: PositionInfo[] = []
    const all: PositionInfo[] = []
    // Sorted requests page by offset, so pages can overlap; keep the first occurrence.
    const seenKeys = new Set<string>()

    const loadedPositions = infiniteData?.pages.flatMap((page: GetWalletPositions) => page.positions) ?? []
    for (const position of loadedPositions) {
      const parsed = parseLiquidityServicePosition(position)
      if (!parsed) {
        continue
      }
      const key = getPositionKey(parsed)
      if (seenKeys.has(key)) {
        continue
      }
      seenKeys.add(key)
      // The request is already filtered by status server-side; here we only split the returned
      // positions into visible vs Redux-hidden for the UI's hidden section.
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
  }, [infiniteData?.pages, isPositionVisible])

  return {
    positions,
    hiddenPositions,
    allPositions,
    pagesLoaded: infiniteData?.pages.length ?? 0,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
    hasNextPage,
    hasData: data !== undefined,
    error,
    refetch: gatedRefetch,
    fetchNextPage,
  }
}
