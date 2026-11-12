import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'
import {
  DEFAULT_LP_POSITION_PROTOCOL_FILTER,
  DEFAULT_LP_POSITION_STATUS_FILTER,
  type V2PositionStatusFilter,
} from '~/features/Liquidity/constants'
import { usePositionSort, type UsePositionSortResult } from '~/features/Liquidity/hooks/usePositionSort'
import { useShowHiddenPositions } from '~/features/Liquidity/hooks/useShowHiddenPositions'
import { useV2StatusFilter } from '~/features/Liquidity/hooks/useV2StatusFilter'
import type { PositionsTableControlBarProps } from '~/features/Liquidity/PositionsTableControlBar'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { buildPortfolioUrl } from '~/hooks/usePortfolioRoutes/utils'

/**
 * The portfolio header owns chain scope (the route's `?chain=`), so the table's chain setter must
 * be inert. Safe only while `showNetworkFilter` stays false — mounting the dropdown would render
 * an inert selector. `chainFilter` still carries the route scope so the table's empty state reads
 * it as an active filter and offers Clear filters.
 */
export function routeOwnedChainNoop(): void {}

interface PortfolioPoolsFilters extends UsePositionSortResult {
  search: string
  setSearch: (value: string) => void
  versionFilter: ProtocolVersion[]
  statusFilter: PositionStatus[]
  v2StatusFilter: V2PositionStatusFilter[]
  toggleVersion: (version: ProtocolVersion) => void
  toggleStatus: (status: PositionStatus) => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (showHiddenPositions: boolean) => void
  clearFiltersAndSearch: () => void
  positionsTableControlBarProps: PositionsTableControlBarProps
}

/**
 * Filter, search, sort, and hidden-toggle state for the Portfolio Pools tab, bundled with the
 * control-bar props the V2 positions table consumes.
 */
export function usePortfolioPoolsFilters({
  chainId,
  externalAddress,
  positionsOwnerAddress,
}: {
  chainId: UniverseChainId | undefined
  externalAddress: string | undefined
  positionsOwnerAddress: string | undefined
}): PortfolioPoolsFilters {
  const [search, setSearch] = useState('')
  const [versionFilter, setVersionFilter] = useState(() => [...DEFAULT_LP_POSITION_PROTOCOL_FILTER])
  const [statusFilter, setStatusFilter] = useState(() => [...DEFAULT_LP_POSITION_STATUS_FILTER])
  const { v2StatusFilter, toggleV2Status, resetV2Status } = useV2StatusFilter()
  const { showHiddenPositions, setShowHiddenPositions } = useShowHiddenPositions(positionsOwnerAddress)

  const toggleVersion = useCallback((version: ProtocolVersion) => {
    setVersionFilter((prev) => (prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]))
  }, [])

  const toggleStatus = useCallback((status: PositionStatus) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }, [])

  const { sort, onSort } = usePositionSort()

  const navigate = useNavigate()
  // Resets search, the dropdown filters, the Hidden toggle, and the chain scope. The range tabs
  // are navigation, not a filter, so their selection survives a clear.
  const clearFiltersAndSearch = useEvent(() => {
    setSearch('')
    setVersionFilter([...DEFAULT_LP_POSITION_PROTOCOL_FILTER])
    resetV2Status()
    setShowHiddenPositions(false)
    if (chainId) {
      navigate(buildPortfolioUrl({ tab: PortfolioTab.Pools, externalAddress }))
    }
  })

  const positionsTableControlBarProps: PositionsTableControlBarProps = {
    statusFilter: v2StatusFilter,
    onToggleStatus: toggleV2Status,
    rangeFilter: statusFilter,
    setRangeFilter: setStatusFilter,
    versionFilter,
    toggleVersion,
    chainFilter: chainId ?? null,
    setChainFilter: routeOwnedChainNoop,
    showHiddenPositions,
    setShowHiddenPositions,
    showNetworkFilter: false,
    search,
    onSearchChange: setSearch,
    onClearFilters: clearFiltersAndSearch,
  }

  return {
    search,
    setSearch,
    versionFilter,
    statusFilter,
    v2StatusFilter,
    toggleVersion,
    toggleStatus,
    showHiddenPositions,
    setShowHiddenPositions,
    sort,
    onSort,
    clearFiltersAndSearch,
    positionsTableControlBarProps,
  }
}
