import type { UniverseChainId } from '@universe/chains'
import { useMedia } from '@universe/mycelium'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import type { LivePoolVolumePeriod } from '~/components/Charts/timeLabels'
import { Table } from '~/components/Table'
import type { TableEmptyState, TableErrorState } from '~/components/Table/types'
import type { PoolSortFields } from '~/data/pools/poolStats'
import { usePoolTableColumns } from '~/features/Liquidity/PoolsTable/hooks/usePoolTableColumns'
import { usePoolTableRows } from '~/features/Liquidity/PoolsTable/hooks/usePoolTableRows'
import type { PoolLinkData, PoolTableLinkState, PoolTableValues } from '~/features/Liquidity/PoolsTable/types'
import type { PoolStat } from '~/types/explore'

// Taller than the default row: the Pool column stacks the pair name over its protocol/fee/hook line.
const ROW_HEIGHT = 64

export function PoolsTable({
  pools,
  loading,
  error,
  errorState,
  emptyState,
  loadMore,
  maxWidth,
  maxHeight,
  hiddenColumns,
  hideIndex,
  getLink,
  linkState,
  selectedPoolId,
  selectedPoolChainId,
  surface,
  scopedCategoryId,
  virtualized,
  stickyTopOffset,
  mobileFullBleed,
  chainId: listChainId,
  filterString,
  volumeTimePeriod,
  showHookBadges = true,
  rowAnalyticsProperties,
  columnOrder,
  onSort,
}: {
  pools?: PoolStat[]
  showHookBadges?: boolean
  rowAnalyticsProperties?: Record<string, unknown>
  columnOrder?: readonly (keyof PoolTableValues)[]
  volumeTimePeriod?: LivePoolVolumePeriod
  loading: boolean
  error?: boolean
  errorState?: TableErrorState
  emptyState?: TableEmptyState
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  maxWidth?: number
  maxHeight?: number
  hiddenColumns?: PoolSortFields[]
  hideIndex?: boolean
  getLink?: (pool: PoolLinkData) => string
  linkState?: PoolTableLinkState
  /**
   * The search that produced these rows, stamped on each row's impression analytics. Passed in
   * rather than read from a store: each surface keeps its search somewhere different (Explore's
   * tables filter store, the pool browser's local state), and a store read silently reported an
   * empty search on every surface but Explore.
   */
  filterString?: string
  /** Where this table is mounted — attached to sort analytics so surfaces aren't conflated. */
  surface: ExploreTableSurface
  /** Category every row already belongs to (selected chip, category page); rows tag the next one instead. */
  scopedCategoryId?: string
  // The matching row renders with a selected highlight — used by the add-liquidity pool browser,
  // where the table stays visible after a pool is picked.
  selectedPoolId?: string
  selectedPoolChainId?: UniverseChainId
  virtualized?: boolean
  /** Extra clearance between the app header and the sticky header row; see `TableProps`. */
  stickyTopOffset?: number
  /** See `TableProps.mobileFullBleed`. */
  mobileFullBleed?: boolean
  // The one chain every listed pool is on, when the list is chain-filtered. Scopes the hook-registry
  // fetch to that chain. Required so the full cross-chain registry is an explicit `undefined` for an
  // all-networks list, never the default a new consumer falls into by forgetting the prop.
  chainId: UniverseChainId | undefined
  /** Runs after a header sort, e.g. Explore scrolling back up to its table section. */
  onSort?: () => void
}) {
  const poolTableValues = usePoolTableRows({
    pools,
    listChainId,
    surface,
    volumeTimePeriod,
    showHookBadges,
    scopedCategoryId,
    selectedPoolId,
    selectedPoolChainId,
    getLink,
    linkState,
    filterString,
    rowAnalyticsProperties,
  })

  // The shared table body renders an error as a skeleton plus an error box, whatever rows it holds, so
  // handing it a load-more failure would blank a list the user is already reading. Only an empty list
  // becomes the error state; a failed page keeps what loaded and lets the next scroll retry.
  const showError = !!error && !pools?.length
  const showLoadingSkeleton = loading || showError
  const media = useMedia()
  const columns = usePoolTableColumns({
    showLoadingSkeleton,
    surface,
    volumeTimePeriod,
    hiddenColumns,
    hideIndex,
    columnOrder,
    onSort,
  })

  return (
    <Table
      mobileFullBleed={mobileFullBleed}
      columns={columns}
      data={poolTableValues}
      loading={loading}
      error={showError}
      errorState={errorState}
      emptyState={emptyState}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      loadMore={loadMore}
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      defaultPinnedColumns={['index', 'poolDescription']}
      virtualized={virtualized}
      stickyTopOffset={stickyTopOffset}
      // Mobile: the pinned pool column (the only pinned one once `index` is hidden) collapses to its pair logo on horizontal scroll.
      collapsiblePinnedColumnId={media.lg ? 'poolDescription' : undefined}
    />
  )
}
