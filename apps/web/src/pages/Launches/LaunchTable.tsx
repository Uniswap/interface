// Cells read `getValue?.()` because the shared Table renders its loading skeleton by invoking each
// cell with an empty context; the tanstack types don't model that, so the optional chain reads as
// "unnecessary" (same disable as the Auctions table).
/* oxlint-disable typescript/no-unnecessary-condition */
import { createColumnHelper } from '@tanstack/react-table'
import { LaunchesOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, Text, useMedia } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { getTokenDescriptionColumnSize, TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { LaunchItem } from '~/pages/Launches/launchesModel'
import { formatDurationShort } from '~/pages/Launches/launchFormat'
import { LAUNCHPAD_COLUMN_META, LAUNCHPAD_COLUMN_WIDTH, LaunchpadCellContent } from '~/pages/Launches/LaunchpadCell'

interface LaunchTableValue {
  launch: LaunchItem
  /** 1-based position in the full loaded list — keeps numbering continuous across infinite-scroll pages. */
  index: number
  // Table's row wrapper reads `testId` for each row's data-testid, links rows with `link`, and
  // fires a click event from `analytics` (same mechanism as the auction table).
  testId: string
  link?: string
  analytics: {
    elementName: ElementName
    properties: Record<string, unknown>
  }
}

// Same row height as the Explore tokens table — its stacked name/symbol token cell needs the extra room.
const ROW_HEIGHT = 64

// This table widens the shared launchpad width by 25px (taken from the fdv, liquidity, and age
// columns) so the longest registry name ("pools.trade") fits without truncation; TopAuctionsTable
// keeps the shared LAUNCHPAD_COLUMN_WIDTH.
const LAUNCH_TABLE_LAUNCHPAD_WIDTH = LAUNCHPAD_COLUMN_WIDTH + 25

function HeaderLabel({
  children,
  justifyContent,
}: {
  children: string
  justifyContent: FlexProps['justifyContent']
}): JSX.Element {
  return (
    <HeaderCell justifyContent={justifyContent}>
      <Text variant="body3" color="$neutral2" fontWeight="500">
        {children}
      </Text>
    </HeaderCell>
  )
}

/**
 * Right-aligned clickable header that sorts the table by `sort`. Clicking the active column flips
 * direction; the arrow marks the active column and points up (asc) or down (desc) accordingly.
 */
function SortableHeaderLabel({
  children,
  sort,
  activeSort,
  ascending,
  onSort,
}: {
  children: string
  sort: LaunchesOrderBy
  activeSort: LaunchesOrderBy
  ascending: boolean
  onSort: (sort: LaunchesOrderBy) => void
}): JSX.Element {
  const active = activeSort === sort
  return (
    <HeaderCell justifyContent="flex-end">
      <ClickableHeaderRow onPress={() => onSort(sort)} group>
        <Flex opacity={active ? 1 : 0}>
          <HeaderArrow orderDirection={active && ascending ? 'asc' : 'desc'} size="$icon.16" />
        </Flex>
        <HeaderSortText active={active}>{children}</HeaderSortText>
      </ClickableHeaderRow>
    </HeaderCell>
  )
}

function FiatCell({ value, loading }: { value?: number; loading?: boolean }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return (
    <Cell justifyContent="flex-end" loading={loading}>
      <TableText>{value !== undefined ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '-'}</TableText>
    </Cell>
  )
}

/** Signed percent-change cell: colored arrow + absolute magnitude (mirrors the token table's delta). */
function DeltaCell({ value, loading }: { value?: number; loading?: boolean }): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const formattedAbs = formatPercent(value !== undefined ? Math.abs(value) : undefined)
  return (
    <Cell justifyContent="flex-end" loading={loading}>
      {value !== undefined ? (
        <Flex row alignItems="center" gap="$gap4" justifyContent="flex-end">
          <DeltaArrow delta={value} formattedDelta={formattedAbs} />
          <TableText>{formattedAbs}</TableText>
        </Flex>
      ) : (
        <TableText color="$neutral2">-</TableText>
      )}
    </Cell>
  )
}

/**
 * All-launches table view, built on the shared Explore `Table` (tanstack columns + Cell/HeaderCell,
 * pinned token column). Infinite scroll is server-backed: reaching the bottom calls `onLoadMore`,
 * which fetches the next ListLaunches page. Table thumbnails keep the network indicator; external
 * launchpad rows have no curve progress, so that column shows the missing-data dash.
 */
export function LaunchTable({
  launches,
  loading,
  hasNextPage,
  onLoadMore,
  sortBy,
  ascending,
  onSort,
}: {
  launches: LaunchItem[]
  loading: boolean
  hasNextPage: boolean
  onLoadMore: () => Promise<void>
  sortBy: LaunchesOrderBy
  ascending: boolean
  onSort: (sort: LaunchesOrderBy) => void
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()

  // Bridge the API's fetch-next-page to the shared Table's scroll trigger; onComplete fires once the
  // page resolves so the load-more indicator clears and the next scroll can fetch again.
  const loadMore = useMemo(
    () =>
      hasNextPage
        ? ({ onComplete }: { onComplete?: () => void }) => {
            void onLoadMore().finally(() => onComplete?.())
          }
        : undefined,
    [hasNextPage, onLoadMore],
  )

  const tableValues: LaunchTableValue[] = useMemo(
    () =>
      launches.map((launch, i) => ({
        launch,
        index: i + 1,
        testId: TestID.LaunchTableRow,
        ...(launch.detailPath ? { link: launch.detailPath } : {}),
        analytics: {
          elementName: ElementName.LaunchesTableRow,
          properties: {
            chain_id: launch.logoChainId,
            token_address: launch.tokenAddress,
            token_symbol: launch.symbol,
            launchpad_id: launch.launchpadId,
            is_quick_launch: launch.isQuickLaunch,
            launch_list_index: i + 1,
            launch_list_length: launches.length,
          },
        },
      })),
    [launches],
  )

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<LaunchTableValue>()
    // Desktop column sizes sum to 1120 (table max width) so all columns fit without horizontal
    // scroll. On lg (mobile) rank hides and the pinned token column matches Explore's width so the
    // data columns stay visible while scrolling.
    const filteredColumns = [
      !media.lg
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            size: 60,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2">
                  #
                </Text>
              </HeaderCell>
            ),
            cell: (index) => (
              <Cell justifyContent="flex-start" loading={loading}>
                <TableText>{index.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row.launch, {
        id: 'tokenName',
        size: media.lg ? getTokenDescriptionColumnSize(true) : 238,
        header: () => <HeaderLabel justifyContent="flex-start">{t('explore.table.column.token')}</HeaderLabel>,
        cell: (cell) => {
          const launch = cell.getValue?.()
          return (
            <Cell justifyContent="flex-start" loading={loading} testId={TestID.NameCell}>
              <TableText flex={1} minWidth={0} width="100%">
                {launch ? (
                  <TokenDescription
                    name={launch.name}
                    symbol={launch.symbol}
                    address={launch.tokenAddress}
                    chainId={launch.logoChainId}
                    logoUrl={launch.logoUrl}
                  />
                ) : null}
              </TableText>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.launch, {
        id: 'launchpad',
        size: LAUNCH_TABLE_LAUNCHPAD_WIDTH,
        meta: LAUNCHPAD_COLUMN_META,
        header: () => <HeaderLabel justifyContent="flex-start">{t('launches.table.launchpad')}</HeaderLabel>,
        cell: (cell) => {
          const launch = cell.getValue?.()
          return (
            <Cell justifyContent="flex-start" loading={loading}>
              <LaunchpadCellContent label={launch?.launchpadLabel} logoUrl={launch?.launchpadLogoUrl} />
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.launch.fdvUsd, {
        id: 'fdv',
        size: 115,
        header: () => <HeaderLabel justifyContent="flex-end">{t('stats.fdv')}</HeaderLabel>,
        cell: (cell) => <FiatCell value={cell.getValue?.()} loading={loading} />,
      }),
      columnHelper.accessor((row) => row.launch.volume24hUsd, {
        id: 'volume',
        size: 130,
        header: () => (
          <SortableHeaderLabel
            sort={LaunchesOrderBy.VOLUME_1D}
            activeSort={sortBy}
            ascending={ascending}
            onSort={onSort}
          >
            {t('launches.card.volume24h')}
          </SortableHeaderLabel>
        ),
        cell: (cell) => <FiatCell value={cell.getValue?.()} loading={loading} />,
      }),
      columnHelper.accessor((row) => row.launch.liquidityUsd, {
        id: 'liquidity',
        size: 120,
        // Deliberately not sortable for now (static header); revert this commit to restore TVL sorting.
        header: () => <HeaderLabel justifyContent="flex-end">{t('common.liquidity')}</HeaderLabel>,
        cell: (cell) => <FiatCell value={cell.getValue?.()} loading={loading} />,
      }),
      columnHelper.accessor((row) => row.launch.priceChangePercent1h, {
        id: 'priceChange1h',
        size: 110,
        header: () => (
          <SortableHeaderLabel
            sort={LaunchesOrderBy.PRICE_CHANGE_1H}
            activeSort={sortBy}
            ascending={ascending}
            onSort={onSort}
          >
            {t('common.oneHour.short')}
          </SortableHeaderLabel>
        ),
        cell: (cell) => <DeltaCell value={cell.getValue?.()} loading={loading} />,
      }),
      columnHelper.accessor((row) => row.launch.priceChangePercent24h, {
        id: 'priceChange24h',
        size: 110,
        header: () => (
          <SortableHeaderLabel
            sort={LaunchesOrderBy.PRICE_CHANGE_1D}
            activeSort={sortBy}
            ascending={ascending}
            onSort={onSort}
          >
            {t('common.oneDay.short')}
          </SortableHeaderLabel>
        ),
        cell: (cell) => <DeltaCell value={cell.getValue?.()} loading={loading} />,
      }),
      columnHelper.accessor((row) => row.launch.createdSecondsAgo, {
        id: 'age',
        // 100 rather than 90: HeaderSortText is nowrap with no textOverflow, and the longer
        // translated labels (es "Antigüedad", ru "Возраст") need the extra room next to the sort
        // arrow to avoid hard-clipping.
        size: 100,
        header: () => (
          <SortableHeaderLabel
            sort={LaunchesOrderBy.LAUNCHED_AT}
            activeSort={sortBy}
            ascending={ascending}
            onSort={onSort}
          >
            {t('launches.table.age')}
          </SortableHeaderLabel>
        ),
        cell: (cell) => {
          const value = cell.getValue?.()
          return (
            <Cell justifyContent="flex-end" loading={loading}>
              <TableText color="$neutral2">{value !== undefined ? formatDurationShort(value) : '-'}</TableText>
            </Cell>
          )
        },
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [media.lg, t, loading, sortBy, ascending, onSort])

  return (
    <Table
      columns={columns}
      data={tableValues}
      loading={loading}
      loadMore={loadMore}
      maxWidth={1120}
      rowHeight={ROW_HEIGHT}
      compactRowHeight={ROW_HEIGHT}
      defaultPinnedColumns={['index', 'tokenName']}
    />
  )
}
