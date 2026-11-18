import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import {
  type InitialAuctionFilters,
  useExploreTablesFilterStore,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'

/**
 * ExploreRoute seeds the filter store from these once on mount; after that the store is the source of
 * truth and `useSyncAuctionFilterParams` rewrites the URL from it, so a link carrying these params into
 * an already-mounted Explore isn't adopted.
 */
const AUCTION_FILTER_PARAM = 'filter'
const AUCTION_STATUS_PARAM = 'status'

function parseFilterParam<T extends string>({
  values,
  value,
  defaultValue,
}: {
  values: Record<string, T>
  value: string | null
  defaultValue: T
}): T | undefined {
  const match = Object.values(values).find((candidate) => candidate === value)
  return match === defaultValue ? undefined : match
}

// Pre-status-dropdown links carried the lifecycle in ?filter=; the mirror rewrites them to ?status= on load.
const LEGACY_FILTER_STATUS: Partial<Record<string, AuctionStatus>> = {
  active: AuctionStatus.Active,
  completed: AuctionStatus.Launched,
}

export function auctionFiltersFromParams(params: URLSearchParams): InitialAuctionFilters {
  const filter = params.get(AUCTION_FILTER_PARAM)
  return {
    quickFilter: parseFilterParam({
      values: AuctionQuickFilter,
      value: filter,
      defaultValue: AuctionQuickFilter.All,
    }),
    statusFilter: parseFilterParam({
      values: AuctionStatus,
      value: params.get(AUCTION_STATUS_PARAM) ?? LEGACY_FILTER_STATUS[filter ?? ''] ?? null,
      defaultValue: AuctionStatus.All,
    }),
  }
}

function setFilterParam({
  params,
  key,
  value,
  defaultValue,
}: {
  params: URLSearchParams
  key: string
  value: string
  defaultValue: string
}): void {
  if (value === defaultValue) {
    params.delete(key)
  } else {
    params.set(key, value)
  }
}

export function useSyncAuctionFilterParams(): void {
  const [searchParams, setSearchParams] = useSearchParams()
  const quickFilter = useExploreTablesFilterStore((state) => state.quickFilter)
  const statusFilter = useExploreTablesFilterStore((state) => state.statusFilter)

  useEffect(() => {
    const updated = new URLSearchParams(searchParams)
    setFilterParam({
      params: updated,
      key: AUCTION_FILTER_PARAM,
      value: quickFilter,
      defaultValue: AuctionQuickFilter.All,
    })
    setFilterParam({ params: updated, key: AUCTION_STATUS_PARAM, value: statusFilter, defaultValue: AuctionStatus.All })
    if (updated.toString() === searchParams.toString()) {
      return
    }
    setSearchParams(updated, { replace: true })
  }, [quickFilter, statusFilter, searchParams, setSearchParams])
}
