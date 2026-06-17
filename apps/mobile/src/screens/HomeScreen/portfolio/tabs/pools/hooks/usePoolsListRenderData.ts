import type { ConnectError } from '@connectrpc/connect'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { useEvent } from 'utilities/src/react/hooks'
import { usePendingLiquidityTransactionsChangeListener } from 'wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener'

export interface PoolsListRenderData {
  positions: PositionInfo[]
  hasData: boolean
  error: ConnectError | null
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  refetch: () => void
  onListEndReached: () => void
}

export type PoolsTabRenderData = Omit<PoolsListRenderData, 'onListEndReached'>

/**
 * Provides the Home Pools tab's positions + pagination for the outer feed FlatList. Fetches all
 * statuses + hidden at the default page size so it shares the ListPositions cache key with
 * `usePoolsTabVisibility` — opening the tab triggers no extra request.
 */
export function usePoolsListRenderData({ owner, skip }: { owner: string; skip: boolean }): PoolsListRenderData {
  const { chains } = useEnabledChains({ platform: Platform.EVM })

  const { positions, hasData, error, refetch, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWalletPositions({
      account: owner,
      chainIds: chains,
      statuses: POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.All],
      includeHidden: true,
      autoFetchAllPages: false,
      disabled: skip,
      pollInterval: PollingInterval.Normal,
    })

  usePendingLiquidityTransactionsChangeListener(refetch)

  const onListEndReached = useEvent((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  })

  return {
    positions,
    hasData,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    onListEndReached,
  }
}
