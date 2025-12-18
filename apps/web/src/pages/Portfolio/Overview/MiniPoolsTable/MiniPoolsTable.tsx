import { createColumnHelper, Row } from '@tanstack/react-table'
import { SharedEventName } from '@uniswap/analytics-events'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils/getPositionUrl'
import { parseRestPosition } from 'components/Liquidity/utils/parseFromRest'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { hasRow } from 'components/Table/utils/hasRow'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { PoolBalanceCell } from 'pages/Portfolio/Overview/MiniPoolsTable/columns/Balance'
import { PoolFeesCell } from 'pages/Portfolio/Overview/MiniPoolsTable/columns/Fees'
import { PoolInfoCell } from 'pages/Portfolio/Overview/MiniPoolsTable/columns/Info'
import { PoolStatusCell } from 'pages/Portfolio/Overview/MiniPoolsTable/columns/Status'
import { TableSectionHeader } from 'pages/Portfolio/Overview/TableSectionHeader'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const POOLS_TABLE_MAX_HEIGHT = 800
const POOLS_TABLE_MAX_WIDTH = 1200

interface MiniPoolsTableProps {
  account: string
  maxPools?: number
  chainId?: UniverseChainId
}

export const MiniPoolsTable = memo(function MiniPoolsTable({ account, maxPools = 5, chainId }: MiniPoolsTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trace = useTrace()
  const { chains } = useEnabledChains()

  // Positions are EVM-only (Uniswap V2/V3/V4), so skip if no EVM address
  const skipQuery = !account

  const { data, isLoading } = useGetPositionsQuery(
    {
      address: account,
      chainIds: chainId ? [chainId] : chains,
      positionStatuses: [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE],
      protocolVersions: [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4],
      includeHidden: false,
    },
    skipQuery,
  )

  // Parse and limit the number of positions displayed
  const limitedPositions = useMemo(() => {
    if (!data?.positions) {
      return []
    }
    const parsedPositions = data.positions
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => position !== undefined)
    return parsedPositions.slice(0, maxPools)
  }, [data?.positions, maxPools])

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PositionInfo>()
    const showLoadingSkeleton = isLoading

    return [
      // First Column - Pool Info
      columnHelper.display({
        id: 'poolInfo',
        minSize: 240,
        size: 240,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.pool')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-start">
              {hasRow<PositionInfo>(info) && <PoolInfoCell position={info.row.original} />}
            </Cell>
          )
        },
      }),

      // Second Column - Status
      columnHelper.display({
        id: 'status',
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.status')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<PositionInfo>(info) && <PoolStatusCell position={info.row.original} />}
            </Cell>
          )
        },
      }),

      // Third Column - Fees
      columnHelper.display({
        id: 'fees',
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.fees')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<PositionInfo>(info) && <PoolFeesCell position={info.row.original} />}
            </Cell>
          )
        },
      }),

      // Fourth Column - Balance
      columnHelper.display({
        id: 'balance',
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.overview.pools.column.balance')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="flex-end">
              {hasRow<PositionInfo>(info) && <PoolBalanceCell position={info.row.original} />}
            </Cell>
          )
        },
      }),
    ]
  }, [isLoading, t])

  const rowWrapper = useCallback(
    (row: Row<PositionInfo>, content: JSX.Element) => {
      const position = row.original
      return (
        <TouchableArea
          onPress={() => {
            sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
              element: ElementName.PortfolioMiniPoolRow,
              section: SectionName.PortfolioOverviewTab,
              ...trace,
            })
            navigate(getPositionUrl(position))
          }}
          cursor="pointer"
        >
          {content}
        </TouchableArea>
      )
    },
    [navigate, trace],
  )

  // Only show loading state if we don't have data yet
  const tableLoading = isLoading && !limitedPositions.length

  if (limitedPositions.length === 0 && !isLoading) {
    return null
  }

  return (
    <Flex gap="$gap12">
      <TableSectionHeader
        title={t('common.pools')}
        subtitle={t('portfolio.overview.pools.subtitle.openPositions', {
          numPositions: limitedPositions.length,
          count: limitedPositions.length,
        })}
      >
        <Table
          columns={columns}
          data={limitedPositions}
          loading={tableLoading}
          error={false}
          v2={true}
          rowWrapper={rowWrapper}
          rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
          defaultPinnedColumns={['poolInfo']}
          maxWidth={POOLS_TABLE_MAX_WIDTH}
          centerArrows
          maxHeight={POOLS_TABLE_MAX_HEIGHT}
        />
      </TableSectionHeader>
      <ViewAllButton
        href="/positions"
        label={t('portfolio.overview.pools.table.viewAllPools')}
        elementName={ElementName.PortfolioViewAllPools}
      />
    </Flex>
  )
})
