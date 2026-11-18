/* oxlint-disable typescript/no-unnecessary-condition */
import { createColumnHelper, type Row } from '@tanstack/react-table'
import { Text, useMedia } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { NumberType } from 'utilities/src/format/types'
import type { LivePoolVolumePeriod } from '~/components/Charts/timeLabels'
import { Cell } from '~/components/Table/Cell'
import {
  FLUSH_CELL_PADDING,
  FLUSH_COLLAPSED_COLUMN_WIDTH,
  FLUSH_HEADER_CELL_PADDING,
} from '~/components/Table/PinnedColumns/collapse/utils'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { PoolSortFields } from '~/data/pools/poolStats'
import { OrderDirection } from '~/data/util'
import { AprCell } from '~/features/Liquidity/PoolsTable/components/AprCell'
import { PoolTableHeader } from '~/features/Liquidity/PoolsTable/components/PoolTableHeader'
import { usePoolTableStore } from '~/features/Liquidity/PoolsTable/state/poolTableStore'
import type { PoolTableValues } from '~/features/Liquidity/PoolsTable/types'
import {
  getPoolSortMethodForPeriod,
  POOL_VOLUME_PERIOD_CONFIG,
} from '~/features/Liquidity/PoolsTable/utils/poolVolumePeriods'

const MOBILE_POOL_COLUMN_SIZE_PX = 210

export function usePoolTableColumns({
  showLoadingSkeleton,
  surface,
  volumeTimePeriod,
  hiddenColumns,
  hideIndex,
  columnOrder,
  onSort,
}: {
  showLoadingSkeleton: boolean
  surface: ExploreTableSurface
  volumeTimePeriod?: LivePoolVolumePeriod
  hiddenColumns?: PoolSortFields[]
  hideIndex?: boolean
  columnOrder?: readonly (keyof PoolTableValues)[]
  onSort?: () => void
}) {
  const { t } = useTranslation()
  const media = useMedia()
  // Surfaces that opted out of the old reward-APR column keep opting out of the sub-line.
  const showBoostedApr = !hiddenColumns?.includes(PoolSortFields.RewardApr)

  const { formatNumberOrString } = useLocalizationContext()
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))
  const effectiveSortMethod = getPoolSortMethodForPeriod(sortMethod, volumeTimePeriod)
  const volumeConfig = volumeTimePeriod !== undefined ? POOL_VOLUME_PERIOD_CONFIG[volumeTimePeriod] : undefined
  const volumeSortMethod = volumeConfig?.sortField ?? PoolSortFields.Volume24h
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc

  return useMemo(() => {
    const columnHelper = createColumnHelper<PoolTableValues>()
    const filteredColumns = [
      !media.lg && !hideIndex
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
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <TableText>{index.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row.poolDescription, {
        id: 'poolDescription',
        size: media.lg ? MOBILE_POOL_COLUMN_SIZE_PX : 240,
        meta: { collapsedWidth: FLUSH_COLLAPSED_COLUMN_WIDTH },
        header: () => (
          <HeaderCell justifyContent="flex-start" {...(media.lg ? FLUSH_HEADER_CELL_PADDING : undefined)}>
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {t('common.pool')}
            </Text>
          </HeaderCell>
        ),
        cell: (poolDescription) => (
          <Cell
            justifyContent="flex-start"
            loading={showLoadingSkeleton}
            {...(media.lg ? FLUSH_CELL_PADDING : undefined)}
          >
            {poolDescription.getValue?.()}
          </Cell>
        ),
      }),
      !hiddenColumns?.includes(PoolSortFields.TVL)
        ? columnHelper.accessor((row) => row.tvl, {
            id: 'tvl',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.TVL}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.TVL}
                  direction={orderDirection}
                  surface={surface}
                  onSort={onSort}
                />
              </HeaderCell>
            ),
            cell: (tvl) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>{tvl.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Volume24h)
        ? columnHelper.accessor((row) => (volumeTimePeriod !== undefined ? row.selectedVolume : row.volume24h), {
            id: volumeTimePeriod !== undefined ? 'volume' : 'volume24h',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={volumeSortMethod}
                  isCurrentSortMethod={effectiveSortMethod === volumeSortMethod}
                  direction={orderDirection}
                  surface={surface}
                  onSort={onSort}
                />
              </HeaderCell>
            ),
            cell: (volume24h) => {
              return (
                <Cell loading={showLoadingSkeleton}>
                  <TableText>{volume24h?.getValue?.()}</TableText>
                </Cell>
              )
            },
          })
        : null,
      volumeTimePeriod === undefined && !hiddenColumns?.includes(PoolSortFields.Volume30D)
        ? columnHelper.accessor((row) => row.volume30d, {
            id: 'volume30Day',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Volume30D}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.Volume30D}
                  direction={orderDirection}
                  surface={surface}
                  onSort={onSort}
                />
              </HeaderCell>
            ),
            cell: (volumeWeek) => (
              <Cell loading={showLoadingSkeleton}>
                <TableText>{volumeWeek.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.VolOverTvl)
        ? columnHelper.accessor((row) => row.volOverTvl, {
            id: 'volOverTvl',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.VolOverTvl}
                  label={volumeTimePeriod !== undefined ? t('pool.volumeToTvl') : undefined}
                  sortable={volumeConfig?.ratioSortable ?? true}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.VolOverTvl}
                  direction={orderDirection}
                  surface={surface}
                  onSort={onSort}
                />
              </HeaderCell>
            ),
            cell: (volOverTvl) => {
              const value = volOverTvl.getValue?.()
              return (
                <Cell loading={showLoadingSkeleton}>
                  <TableText>
                    {formatNumberOrString({
                      value,
                      type:
                        volumeTimePeriod !== undefined && value === 0
                          ? NumberType.TokenNonTx
                          : NumberType.TokenQuantityStats,
                      placeholder: '-',
                    })}
                  </TableText>
                </Cell>
              )
            },
          })
        : null,
      !hiddenColumns?.includes(PoolSortFields.Apr)
        ? columnHelper.accessor((row) => row.apr, {
            id: 'apr',
            size: 110,
            header: () => (
              <HeaderCell>
                <PoolTableHeader
                  category={PoolSortFields.Apr}
                  isCurrentSortMethod={effectiveSortMethod === PoolSortFields.Apr}
                  direction={orderDirection}
                  surface={surface}
                  onSort={onSort}
                />
              </HeaderCell>
            ),
            cell: ({ row }: { row?: Row<PoolTableValues> }) => {
              if (!row?.original) {
                return <Cell loading={showLoadingSkeleton} />
              }

              const { apr, totalApr, token0CurrencyId, token1CurrencyId, rewards } = row.original

              return (
                <AprCell
                  apr={apr}
                  totalApr={totalApr}
                  rewards={showBoostedApr ? rewards : undefined}
                  token0CurrencyId={token0CurrencyId}
                  token1CurrencyId={token1CurrencyId}
                  isLoading={showLoadingSkeleton}
                />
              )
            },
          })
        : null,
    ]
    const visibleColumns = filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> =>
      Boolean(column),
    )
    if (columnOrder) {
      const positions = new Map<string, number>(columnOrder.map((id, index): [string, number] => [id, index]))
      visibleColumns.sort(
        (a, b) => (positions.get(a.id ?? '') ?? columnOrder.length) - (positions.get(b.id ?? '') ?? columnOrder.length),
      )
    }
    return visibleColumns
  }, [
    media.lg,
    columnOrder,
    hiddenColumns,
    hideIndex,
    showBoostedApr,
    showLoadingSkeleton,
    t,
    effectiveSortMethod,
    volumeSortMethod,
    volumeTimePeriod,
    volumeConfig?.ratioSortable,
    orderDirection,
    formatNumberOrString,
    surface,
    onSort,
  ])
}
