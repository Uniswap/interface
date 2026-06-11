import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/rest/rwa/sparklineUtils'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExpandableIssuerIdentity, ExpandableParentAssetIdentity } from 'uniswap/src/features/expandableAsset'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { OrderDirection } from '~/appGraphql/data/util'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { hasRow } from '~/components/Table/utils/hasRow'
import { useExploreParams } from '~/pages/Explore/redirects'
import { AssetPercentChangeCell } from '~/pages/Explore/rwa/table/AssetPercentChangeCell'
import { AssetSparkline } from '~/pages/Explore/rwa/table/AssetSparkline'
import { ExpandableAssetMetricHeader } from '~/pages/Explore/rwa/table/ExpandableAssetMetricHeader'
import { getExpandableAssetTokenColumnSize } from '~/pages/Explore/rwa/table/expandableAssetTableConstants'
import {
  expandableAssetRowHasMultipleIssuers,
  getExpandableAssetRowMetrics,
  type ExpandableAssetTableRow,
} from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

function safeAccessorGetValue<T>(getValue: (() => T | undefined) | undefined): T | undefined {
  return getValue?.()
}

export function useExpandableAssetTableColumns({
  showLoadingSkeleton,
  multichainTokenUxEnabled,
  enabledChainIds,
  enableSorting = false,
  sortMethod,
  orderDirection,
}: {
  showLoadingSkeleton: boolean
  multichainTokenUxEnabled: boolean
  enabledChainIds: readonly UniverseChainId[]
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  orderDirection?: OrderDirection
}) {
  const { t } = useTranslation()
  const media = useMedia()
  const { chainName } = useExploreParams()
  const hasNetworkFilter = Boolean(chainName)
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

    const tokenColumnSize = getExpandableAssetTokenColumnSize(media.lg, multichainTokenUxEnabled)

    const columns = [
      columnHelper.display({
        id: 'tokenDescription',
        size: tokenColumnSize,
        minSize: tokenColumnSize,
        maxSize: tokenColumnSize,
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
          const description =
            row.type === 'parent' ? (
              <ExpandableParentAssetIdentity
                asset={row.asset}
                canExpand={expandableAssetRowHasMultipleIssuers(row)}
                isExpanded={isExpanded}
                variant="table"
              />
            ) : (
              <ExpandableIssuerIdentity
                asset={row.asset}
                issuer={row.issuer}
                enabledChainIds={enabledChainIds}
                variant="table"
                hasNetworkFilter={hasNetworkFilter}
              />
            )
          return (
            <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
              <Flex {...(row.type === 'parent' ? { group: true } : {})} flex={1} minWidth={0} width="100%">
                <TableText flex={1} minWidth={0} width="100%">
                  {description}
                </TableText>
              </Flex>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).priceUsd, {
        id: 'price',
        maxSize: 140,
        header: createMetricHeader(StocksSortMethod.PRICE),
        cell: (info) => {
          const value = safeAccessorGetValue(info.getValue)
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              <TableText>{convertFiatAmountFormatted(value, NumberType.FiatTokenPrice)}</TableText>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => getExpandableAssetRowMetrics(row).priceChange1hPct, {
        id: 'percentChange1hr',
        maxSize: 100,
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
        maxSize: 140,
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
        maxSize: 120,
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
        meta: { overflowVisible: true },
        maxSize: 150,
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
        maxSize: 120,
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

    return columns
  }, [
    media.lg,
    multichainTokenUxEnabled,
    showLoadingSkeleton,
    t,
    convertFiatAmountFormatted,
    formatPercent,
    enabledChainIds,
    hasNetworkFilter,
    sortMethod,
    orderDirection,
    enableSorting,
  ])
}
