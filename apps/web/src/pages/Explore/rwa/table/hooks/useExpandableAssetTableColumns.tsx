import { createColumnHelper } from '@tanstack/react-table'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/apiClients/dataApiService/rwa/sparklineUtils'
import { ExpandableIssuerIdentity, ExpandableParentAssetIdentity } from 'uniswap/src/features/expandableAsset'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import {
  DATA_COLUMN_CONTENT_WIDTH_PX,
  getDataColumnSizing,
  getFixedColumnSizing,
  getFlexColumnSizing,
  SPARKLINE_COLUMN_WIDTH_PX,
  VOLUME_COLUMN_GAP_PX,
} from '~/components/Table/utils/columnSizing'
import { hasRow } from '~/components/Table/utils/hasRow'
import type { OrderDirection } from '~/data/util'
import { AssetPercentChangeCell } from '~/pages/Explore/rwa/table/AssetPercentChangeCell'
import { AssetSparkline } from '~/pages/Explore/rwa/table/AssetSparkline'
import { ExpandableAssetMetricHeader } from '~/pages/Explore/rwa/table/ExpandableAssetMetricHeader'
import { getExpandableAssetTokenColumnSize } from '~/pages/Explore/rwa/table/expandableAssetTableConstants'
import {
  expandableAssetRowHasMultipleIssuers,
  getExpandableAssetRowMetrics,
  getExpandableAssetRowPriceDisplay,
  type ExpandableAssetTableRow,
} from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'
import { RwaPriceCell } from '~/pages/Explore/rwa/table/RwaPriceCell'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

function safeAccessorGetValue<T>(getValue: (() => T | undefined) | undefined): T | undefined {
  return getValue?.()
}

const RWA_INDEX_COLUMN_SIZE = 60

export function useExpandableAssetTableColumns({
  showLoadingSkeleton,
  enabledChainIds,
  chainFilter,
  enableSorting = false,
  sortMethod,
  orderDirection,
}: {
  showLoadingSkeleton: boolean
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  orderDirection?: OrderDirection
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  return useMemo(() => {
    const columnHelper = createColumnHelper<ExpandableAssetTableRow>()
    const createMetricHeader = (headerSortMethod: StocksSortMethod, omitSortableJustify?: boolean) => {
      function ExpandableAssetTableMetricHeaderCell(): JSX.Element {
        return (
          <ExpandableAssetMetricHeader
            enableSorting={enableSorting}
            sortMethod={headerSortMethod}
            activeSortMethod={sortMethod}
            orderDirection={orderDirection}
            omitSortableJustify={omitSortableJustify}
          />
        )
      }
      return ExpandableAssetTableMetricHeaderCell
    }

    const tokenColumnSize = getExpandableAssetTokenColumnSize(media.lg)

    const columns = [
      !media.lg
        ? columnHelper.display({
            id: 'index',
            ...getFixedColumnSizing(RWA_INDEX_COLUMN_SIZE),
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2">
                  #
                </Text>
              </HeaderCell>
            ),
            cell: (info) => {
              // Only top-level rows are ranked; issuer sub-rows render blank so the groupings stay unnumbered.
              const rank = hasRow<ExpandableAssetTableRow>(info) ? info.row.original.rank : undefined
              return (
                <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                  {rank !== undefined && <TableText>{rank}</TableText>}
                </Cell>
              )
            },
          })
        : null,
      columnHelper.display({
        id: 'tokenDescription',
        ...getFlexColumnSizing(tokenColumnSize),
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (!hasRow<ExpandableAssetTableRow>(info)) {
            return <Cell justifyContent="flex-start" loading={showLoadingSkeleton} />
          }
          const row = info.row.original
          const isExpanded = info.row.getIsExpanded()
          const isFlatIssuerRow = row.type === 'issuer' && info.row.depth === 0
          const description =
            row.type === 'parent' ? (
              <ExpandableParentAssetIdentity
                asset={row.asset}
                enabledChainIds={enabledChainIds}
                canExpand={expandableAssetRowHasMultipleIssuers(row)}
                isExpanded={isExpanded}
                variant="table"
                chainFilter={chainFilter}
              />
            ) : (
              <ExpandableIssuerIdentity
                asset={row.asset}
                issuer={row.issuer}
                enabledChainIds={enabledChainIds}
                variant="table"
                chainFilter={chainFilter}
                useIssuerNameAsPrimary={isFlatIssuerRow}
                showIssuerTag
              />
            )
          return (
            <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
              <Flex flex={1} minWidth={0} width="100%">
                <TableText flex={1} minWidth={0} width="100%">
                  {description}
                </TableText>
              </Flex>
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'price',
        ...getDataColumnSizing(DATA_COLUMN_CONTENT_WIDTH_PX.price),
        header: createMetricHeader(StocksSortMethod.PRICE),
        cell: (info) => {
          if (!hasRow<ExpandableAssetTableRow>(info)) {
            return <Cell loading={showLoadingSkeleton} justifyContent="flex-end" />
          }
          const priceDisplay = getExpandableAssetRowPriceDisplay(info.row.original)
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <RwaPriceCell
                priceDisplay={priceDisplay}
                convertFiatAmountFormatted={convertFiatAmountFormatted}
                formatPercent={formatPercent}
              />
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).priceChange1hPct, {
        id: 'percentChange1hr',
        ...getDataColumnSizing(DATA_COLUMN_CONTENT_WIDTH_PX.percentChange),
        header: createMetricHeader(StocksSortMethod.HOUR_CHANGE),
        cell: (info) => {
          const delta = safeAccessorGetValue(info.getValue)
          return (
            <AssetPercentChangeCell
              delta={delta}
              formattedDelta={formatPercent(delta !== undefined ? Math.abs(delta) : undefined)}
              loading={showLoadingSkeleton}
            />
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).priceChange24hPct, {
        id: 'percentChange1d',
        ...getDataColumnSizing(DATA_COLUMN_CONTENT_WIDTH_PX.percentChange),
        header: createMetricHeader(StocksSortMethod.DAY_CHANGE),
        cell: (info) => {
          const delta = safeAccessorGetValue(info.getValue)
          return (
            <AssetPercentChangeCell
              delta={delta}
              formattedDelta={formatPercent(delta !== undefined ? Math.abs(delta) : undefined)}
              loading={showLoadingSkeleton}
            />
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).marketCapUsd, {
        id: 'marketCap',
        ...getDataColumnSizing(DATA_COLUMN_CONTENT_WIDTH_PX.fiatStat),
        header: createMetricHeader(StocksSortMethod.MARKET_CAP),
        cell: (info) => {
          const value = safeAccessorGetValue(info.getValue)
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <EllipsisText>
                {value !== undefined ? convertFiatAmountFormatted(value, NumberType.FiatTokenStats) : '-'}
              </EllipsisText>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).volume24hUsd, {
        id: 'volume',
        ...getDataColumnSizing(DATA_COLUMN_CONTENT_WIDTH_PX.volume, {
          meta: { overflowVisible: true },
          gapPx: VOLUME_COLUMN_GAP_PX,
        }),
        header: createMetricHeader(StocksSortMethod.VOLUME, true),
        cell: (info) => {
          const value = safeAccessorGetValue(info.getValue)
          return (
            <Cell loading={showLoadingSkeleton} grow justifyContent="flex-end">
              <EllipsisText>{convertFiatAmountFormatted(value, NumberType.FiatTokenStats)}</EllipsisText>
            </Cell>
          )
        },
      }),
      columnHelper.display({
        id: 'sparkline',
        ...getFixedColumnSizing(SPARKLINE_COLUMN_WIDTH_PX),
        header: () => (
          <HeaderCell>
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.tokens.table.column.sparkline')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (!hasRow<ExpandableAssetTableRow>(info)) {
            return <Cell loading={showLoadingSkeleton} />
          }
          const metrics = getExpandableAssetRowMetrics(info.row.original)
          const delta1d = metrics.priceChange24hPct
          const sparklineData = rwaSparklineToChartPoints(metrics.sparkline)
          return (
            <Cell loading={showLoadingSkeleton}>
              <AssetSparkline data={sparklineData} isNegative={(delta1d ?? 0) < 0} width={80} height={20} />
            </Cell>
          )
        },
      }),
    ]

    return columns.filter((column): column is NonNullable<(typeof columns)[number]> => Boolean(column))
  }, [
    media.lg,
    showLoadingSkeleton,
    t,
    convertFiatAmountFormatted,
    formatPercent,
    enabledChainIds,
    chainFilter,
    sortMethod,
    orderDirection,
    enableSorting,
  ])
}
