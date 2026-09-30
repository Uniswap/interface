import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDebouncedCallback } from 'utilities/src/react/useDebouncedCallback'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import {
  hasActiveV2StatusFilter,
  hasActiveV2VersionFilter,
  type V2PositionStatusFilter,
} from '~/features/Liquidity/constants'
import {
  ProtocolFilterDropdown,
  PositionsNetworkFilter,
  StatusFilterDropdown,
} from '~/features/Liquidity/positionsFilters'
import { PositionsRangeFilterDropdown, PositionsStatusChips } from '~/features/Liquidity/PositionsStatusChips'
import { SearchInput } from '~/pages/Portfolio/components/SearchInput'

const SEARCH_DEBOUNCE_MS = 300

export interface PositionsTableControlBarProps {
  statusFilter: V2PositionStatusFilter[]
  onToggleStatus: (status: V2PositionStatusFilter) => void
  // In/out-of-range refinement of open positions, driven by the segmented chips (client-side).
  rangeFilter: PositionStatus[]
  setRangeFilter: (statuses: PositionStatus[]) => void
  versionFilter: ProtocolVersion[]
  toggleVersion: (version: ProtocolVersion) => void
  chainFilter: UniverseChainId | null
  setChainFilter: (chain: UniverseChainId | null) => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (show: boolean) => void
  showNetworkFilter?: boolean
  // Server-side search forwarded to GetWalletPositions (token symbol/name, token address, pool
  // address/id). SearchInput debounces before onSearchChange fires, so each change re-queries.
  search: string
  onSearchChange: (search: string) => void
  /** Resets every filter (and the search) to its default. Powers the "Clear filters" empty state. */
  onClearFilters?: () => void
}

/**
 * Whether any control-bar dimension deviates from its default. The single source for both the
 * table's filter-aware empty state and the pages' empty-view gates — deriving it independently is
 * what let a filtered-empty list swap in the wrong empty view.
 */
export function hasActiveControlBarFilter({
  statusFilter,
  rangeFilter,
  versionFilter,
  chainFilter,
  search,
}: Pick<
  PositionsTableControlBarProps,
  'statusFilter' | 'rangeFilter' | 'versionFilter' | 'chainFilter' | 'search'
>): boolean {
  return (
    hasActiveV2StatusFilter(statusFilter, rangeFilter) ||
    hasActiveV2VersionFilter(versionFilter) ||
    chainFilter !== null ||
    search.trim().length > 0
  )
}

export function PositionsTableControlBar({
  statusFilter,
  onToggleStatus,
  rangeFilter,
  setRangeFilter,
  versionFilter,
  toggleVersion,
  chainFilter,
  setChainFilter,
  showHiddenPositions,
  setShowHiddenPositions,
  showNetworkFilter = true,
  search,
  onSearchChange,
}: PositionsTableControlBarProps): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const shouldStackControls = media.md
  const [localSearch, setLocalSearch] = useState(search)
  const [debouncedSearchChange] = useDebouncedCallback((...args: unknown[]) => {
    onSearchChange(args[0] as string)
  }, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  const onLocalSearchChange = (text: string): void => {
    setLocalSearch(text)
    debouncedSearchChange(text)
  }

  const networkFilter = showNetworkFilter && (
    <PositionsNetworkFilter selectedChain={chainFilter} onChainChange={setChainFilter} />
  )
  const menuAlignRight = shouldStackControls ? false : undefined
  const statusDropdown = (
    <StatusFilterDropdown
      selectedStatuses={statusFilter}
      onToggleStatus={onToggleStatus}
      showHiddenPositions={showHiddenPositions}
      setShowHiddenPositions={setShowHiddenPositions}
      alignRight={menuAlignRight}
      fitContent
    />
  )
  const protocolDropdown = (
    <ProtocolFilterDropdown
      selectedVersions={versionFilter}
      onToggleVersion={toggleVersion}
      alignRight={menuAlignRight}
      fitContent
    />
  )

  if (shouldStackControls) {
    return (
      <Flex gap="$spacing8" alignItems="stretch">
        <PositionsRangeFilterDropdown statusFilter={rangeFilter} setStatusFilter={setRangeFilter} />
        <Flex row alignItems="center" gap="$spacing8">
          {statusDropdown}
          {protocolDropdown}
          {networkFilter}
          <Flex grow />
          <ExpandableSearchInput
            data-testid={TestID.PositionsTableSearchInput}
            value={localSearch}
            onChangeText={onLocalSearchChange}
            placeholder={t('tokens.table.search.placeholder.pools')}
            responsive
          />
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex row flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$spacing8">
      <PositionsStatusChips statusFilter={rangeFilter} setStatusFilter={setRangeFilter} />
      <Flex row alignItems="center" gap="$spacing8">
        {statusDropdown}
        {protocolDropdown}
        {networkFilter}
        <SearchInput
          value={search}
          onChangeText={onSearchChange}
          dataTestId={TestID.PositionsTableSearchInput}
          placeholder={t('tokens.table.search.placeholder.pools')}
          width={200}
        />
      </Flex>
    </Flex>
  )
}
