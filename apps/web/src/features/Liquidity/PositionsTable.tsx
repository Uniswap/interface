/* oxlint-disable typescript/no-unnecessary-condition */

import { createColumnHelper } from '@tanstack/react-table'
import type { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getPositionUrl } from 'uniswap/src/features/positions/getPositionUrl'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getPositionKey } from 'uniswap/src/features/positions/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { HeaderCell } from '~/components/Table/styled'
import {
  getColumnLabel,
  type ColumnId,
  type PositionSort,
  type PositionSortField,
} from '~/features/Liquidity/PositionsTableColumns'
import {
  hasActiveControlBarFilter,
  PositionsTableControlBar,
  type PositionsTableControlBarProps,
} from '~/features/Liquidity/PositionsTableControlBar'
import {
  AprCellContent,
  CreatedCellContent,
  DistributionCellContent,
  FeesCellContent,
  LiquidityCellContent,
  MenuCellContent,
  PoolCellContent,
  RangeCellContent,
} from '~/features/Liquidity/PositionsTableRow'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useScrollClampGuard } from '~/hooks/useScrollClampGuard'

const ROW_HEIGHT = 64
const TABLE_MAX_WIDTH = 1200
const NO_OMITTED_COLUMNS: readonly ColumnId[] = []
// Trimmed from the pool page's positions table, which reads as a compact summary beneath the pool's
// own header and stats; each row still links through to the full position page.
const POOL_SCOPED_OMITTED_COLUMNS: readonly ColumnId[] = ['pool', 'apr', 'created', 'menu']

function getPositionRowTestId(position: PositionInfo): string {
  return `${TestID.PositionsTableRowPrefix}${getPositionKey(position)}`
}

interface PositionRow {
  position: PositionInfo
  isVisible: boolean
  link: string
  testId: string
  analytics: {
    elementName: ElementName
    properties: Record<string, unknown>
  }
}

function getRowAnalytics(position: PositionInfo): PositionRow['analytics'] {
  return {
    elementName: ElementName.LiquidityPositionCard,
    properties: {
      pool_address: position.poolId,
      chain_id: position.chainId,
    },
  }
}

interface PositionsSortProps {
  sort?: PositionSort
  onSort: (field: PositionSortField) => void
}

interface PositionsTableProps extends PositionsTableControlBarProps, PositionsSortProps {
  visiblePositions: PositionInfo[]
  hiddenPositions: PositionInfo[]
  hasNextPage: boolean
  isFetching: boolean
  isPlaceholderData: boolean
  loadMorePositions: (options?: { onComplete?: () => void }) => void
  entryPoint?: string
  readOnly?: boolean
}

type CellAlign = 'flex-start' | 'flex-end' | 'center'

function HeaderLabel({
  id,
  align,
  sortField,
  sort,
  onSort,
}: {
  id: ColumnId
  align: CellAlign
  sortField?: PositionSortField
  sort?: PositionSort
  onSort?: (field: PositionSortField) => void
}): JSX.Element {
  const { t } = useTranslation()
  const label = getColumnLabel(id, t)

  if (!sortField || !onSort) {
    return (
      <HeaderCell justifyContent={align}>
        <Text variant="body3" color="$neutral2" userSelect="none">
          {label}
        </Text>
      </HeaderCell>
    )
  }

  const isActive = sort?.field === sortField
  return (
    <HeaderCell justifyContent={align} clickable>
      <TouchableArea hoverable onPress={() => onSort(sortField)}>
        <Flex row alignItems="center" gap="$spacing4" justifyContent={align}>
          {isActive && <HeaderArrow orderDirection={sort.direction} size="$icon.16" />}
          <HeaderSortText active={isActive}>{label}</HeaderSortText>
        </Flex>
      </TouchableArea>
    </HeaderCell>
  )
}

function usePositionsTableColumns({
  loading,
  sort,
  onSort,
  readOnly,
  omittedColumns,
}: {
  loading: boolean
  sort: PositionSort | undefined
  onSort: (field: PositionSortField) => void
  readOnly: boolean
  omittedColumns: readonly ColumnId[]
}) {
  return useMemo(() => {
    const columnHelper = createColumnHelper<PositionRow>()
    const columns = [
      columnHelper.display({
        id: 'pool' satisfies ColumnId,
        size: 204,
        header: () => <HeaderLabel id="pool" align="flex-start" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start">
              {position ? <PoolCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'position' satisfies ColumnId,
        size: 204,
        header: () => <HeaderLabel id="position" align="flex-start" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start">
              {position ? <RangeCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'distribution' satisfies ColumnId,
        size: 184,
        meta: { overflowVisible: true },
        header: () => (
          <HeaderLabel id="distribution" align="flex-start" sortField="distribution" sort={sort} onSort={onSort} />
        ),
        cell: (info) => {
          const position = info.row?.original?.position
          return (
            <Cell loading={loading} justifyContent="flex-start" overflow="visible">
              {position ? <DistributionCellContent position={position} /> : null}
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'liquidity' satisfies ColumnId,
        size: 108,
        header: () => <HeaderLabel id="liquidity" align="flex-end" sortField="liquidity" sort={sort} onSort={onSort} />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <LiquidityCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'fees' satisfies ColumnId,
        size: 100,
        header: () => <HeaderLabel id="fees" align="flex-end" />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <FeesCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'apr' satisfies ColumnId,
        // Wide enough for the reward-boost badge on its sub-line: Cell eats 24px in padding and
        // clips the overflow, and the badge runs to ~76px once a multi-token pool adds a logo
        // cluster to the percentage.
        size: 132,
        header: () => <HeaderLabel id="apr" align="flex-end" sortField="apr" sort={sort} onSort={onSort} />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <AprCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'created' satisfies ColumnId,
        size: 112,
        header: () => <HeaderLabel id="created" align="flex-end" sortField="created_at" sort={sort} onSort={onSort} />,
        cell: (info) => {
          const position = info.row?.original?.position
          return <Cell loading={loading}>{position ? <CreatedCellContent position={position} /> : null}</Cell>
        },
      }),
      columnHelper.display({
        id: 'menu' satisfies ColumnId,
        size: 48,
        header: () => <HeaderLabel id="menu" align="center" />,
        cell: (info) => {
          const original = info.row?.original
          return (
            <Cell loading={loading} justifyContent="center">
              {original ? (
                <MenuCellContent position={original.position} isVisible={original.isVisible} readOnly={readOnly} />
              ) : null}
            </Cell>
          )
        },
      }),
    ]
    // Callers drop the columns their surrounding page already answers, which also buys back the
    // row width they took (the pool-scoped table sheds 336px this way and stops side-scrolling).
    return columns.filter((column) => !omittedColumns.some((id) => id === column.id))
  }, [loading, sort, onSort, readOnly, omittedColumns])
}

const noopSort = (): void => undefined

function PositionsTableBase({
  data,
  loading,
  error,
  onRetry,
  isPlaceholderData,
  loadMore,
  sort,
  onSort = noopSort,
  controlBarProps,
  readOnly = false,
  omittedColumns = NO_OMITTED_COLUMNS,
}: {
  data: PositionRow[]
  loading: boolean
  error?: boolean
  onRetry?: () => void
  isPlaceholderData: boolean
  loadMore?: (params: { onComplete?: () => void }) => void
  sort?: PositionSort
  onSort?: (field: PositionSortField) => void
  // Omitted by pool-scoped callers, where every dimension the bar controls is fixed by the page.
  controlBarProps?: PositionsTableControlBarProps
  readOnly?: boolean
  omittedColumns?: readonly ColumnId[]
}): JSX.Element {
  const { t } = useTranslation()
  // Rows sit behind the error modal as static skeletons, so the cells must render in their loading
  // state when either loading or errored (matches PoolTable).
  const columns = usePositionsTableColumns({ loading: loading || !!error, sort, onSort, readOnly, omittedColumns })

  const headerHeight = useAppHeaderHeight()
  // A shorter filtered result would otherwise clamp the window scroll and read as a jump to the
  // top; the guard reserves min-height while the user is scrolled into the list.
  const { rootRef, contentRef, minHeight } = useScrollClampGuard(!!controlBarProps)

  // Switching range tabs mid-scroll re-anchors the control bar under the sticky header.
  const setRangeFilterAnchored = useEvent((statuses: PositionStatus[]) => {
    if (!controlBarProps) {
      return
    }
    const { rangeFilter, setRangeFilter } = controlBarProps
    setRangeFilter(statuses)
    // The segmented control fires on a re-press of the active tab, which doesn't re-query.
    const unchanged = statuses.length === rangeFilter.length && statuses.every((s) => rangeFilter.includes(s))
    if (unchanged) {
      return
    }
    const top = rootRef.current?.getBoundingClientRect().top
    if (top !== undefined && top < headerHeight) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollBy({ top: top - headerHeight, behavior: reducedMotion ? 'auto' : 'smooth' })
    }
  })

  // A zero-result table under an active filter means "nothing matches", not "no positions" — prompt
  // the user to adjust the (still-mounted) control bar rather than showing the bare "No data" text.
  const hasActiveFilter = !!controlBarProps && hasActiveControlBarFilter(controlBarProps)
  const onClearFilters = controlBarProps?.onClearFilters
  const emptyState =
    data.length === 0 && hasActiveFilter && !loading && !error
      ? {
          title: t('common.filters.noResults'),
          action: onClearFilters ? (
            <TouchableArea onPress={onClearFilters}>
              <Text variant="buttonLabel3" color="$accent1">
                {t('common.filters.clear')}
              </Text>
            </TouchableArea>
          ) : undefined,
        }
      : undefined

  return (
    <Flex ref={rootRef} minHeight={minHeight} opacity={isPlaceholderData ? 0.6 : 1}>
      <Flex ref={contentRef} gap="$gap24">
        {controlBarProps && <PositionsTableControlBar {...controlBarProps} setRangeFilter={setRangeFilterAnchored} />}
        <Table
          columns={columns}
          data={data}
          loading={loading}
          error={error}
          errorState={
            error ? { title: t('common.error.general'), description: t('positions.error.loading'), onRetry } : undefined
          }
          emptyState={emptyState}
          getRowId={(row) => getPositionKey(row.position)}
          rowHeight={ROW_HEIGHT}
          compactRowHeight={ROW_HEIGHT}
          defaultPinnedColumns={omittedColumns.includes('pool') ? [] : ['pool']}
          maxWidth={TABLE_MAX_WIDTH}
          loadingRowsCount={5}
          loadMore={loadMore}
          windowScrollY
        />
      </Flex>
    </Flex>
  )
}

export function PositionsTable({
  visiblePositions,
  hiddenPositions,
  hasNextPage,
  isPlaceholderData,
  loadMorePositions,
  entryPoint,
  sort,
  onSort,
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
  showNetworkFilter,
  search,
  onSearchChange,
  onClearFilters,
  readOnly = false,
}: PositionsTableProps): JSX.Element {
  const data = useMemo<PositionRow[]>(() => {
    // Derive isVisible from the source array, not the toggle: saved-pair positions are partitioned
    // client-side (they bypass the server-side PositionModifier), so a Redux-hidden pair sits in
    // hiddenPositions even with the toggle off — keying off the toggle would offer "Hide" on it.
    // Read-only viewers (e.g. watched wallets) get the public pool page: the position page is a
    // management surface for the owner.
    const toRow = (position: PositionInfo, isVisible: boolean): PositionRow => ({
      position,
      isVisible,
      link: readOnly ? getPoolDetailsURL(position.poolId, position.chainId) : getPositionUrl(position, { entryPoint }),
      testId: getPositionRowTestId(position),
      analytics: getRowAnalytics(position),
    })
    // The Hidden toggle swaps the whole view: off shows the visible set, on shows ONLY the hidden
    // set (both are always fetched by useWalletPositionsWeb). Unhiding a row while the toggle is on
    // therefore removes it from this hidden-only view, as expected. The control bar (and toggle)
    // stay mounted regardless, so an all-hidden wallet is never stranded.
    return showHiddenPositions
      ? hiddenPositions.map((position) => toRow(position, false))
      : visiblePositions.map((position) => toRow(position, true))
  }, [visiblePositions, hiddenPositions, showHiddenPositions, entryPoint, readOnly])

  return (
    <PositionsTableBase
      data={data}
      loading={false}
      isPlaceholderData={isPlaceholderData}
      loadMore={hasNextPage ? loadMorePositions : undefined}
      sort={sort}
      onSort={onSort}
      readOnly={readOnly}
      controlBarProps={{
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
        showNetworkFilter,
        search,
        onSearchChange,
        onClearFilters,
      }}
    />
  )
}

/**
 * Pool-scoped variant of {@link PositionsTable}: the same rows and row links, trimmed to the
 * columns a pool page doesn't already answer and with no control bar — chain, protocol, status,
 * search, and the pool itself are all fixed by the page around it.
 *
 * One flat list, unlike the wallet table's toggle between the visible and hidden sets: a position
 * the user hid from their portfolio still belongs on its own pool's page.
 */
export function PoolPositionsTable({
  positions,
  isPlaceholderData,
  sort,
  onSort,
}: PositionsSortProps & {
  positions: PositionInfo[]
  isPlaceholderData: boolean
}): JSX.Element {
  const data = useMemo<PositionRow[]>(
    // isVisible only drives the menu cell's Hide/Unhide, and this table omits that column.
    () =>
      positions.map((position) => ({
        position,
        isVisible: true,
        link: getPositionUrl(position),
        testId: getPositionRowTestId(position),
        analytics: getRowAnalytics(position),
      })),
    [positions],
  )

  return (
    <PositionsTableBase
      data={data}
      loading={false}
      isPlaceholderData={isPlaceholderData}
      sort={sort}
      onSort={onSort}
      omittedColumns={POOL_SCOPED_OMITTED_COLUMNS}
    />
  )
}

export function PositionsTableLoader(props: PositionsTableControlBarProps): JSX.Element {
  return <PositionsTableBase data={[]} loading isPlaceholderData={false} controlBarProps={props} />
}

export function PositionsTableError({
  onRetry,
  ...props
}: PositionsTableControlBarProps & { onRetry?: () => void }): JSX.Element {
  return (
    <PositionsTableBase
      data={[]}
      loading={false}
      error
      onRetry={onRetry}
      isPlaceholderData={false}
      controlBarProps={props}
    />
  )
}
