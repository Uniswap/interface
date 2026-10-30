import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table'
import { Flex, Text, useIsTouchDevice, useMedia } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { TestID } from '@universe/test'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell } from '~/components/Table/styled'
import { ActivityAddressCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAddressCell'
import { useActivityAddressLookup } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAddressLookupStore'
import { ActivityAmountCell } from '~/pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ActivityAmountCell'
import { TimeCell } from '~/pages/Portfolio/Activity/ActivityTable/TimeCell'
import { TransactionTypeCell } from '~/pages/Portfolio/Activity/ActivityTable/TransactionTypeCell'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from '~/pages/Portfolio/constants'

const TIME_COLUMN_SIZE_PX = 160
const COLLAPSED_TIME_COLUMN_SIZE_PX = 80

interface ActivityTableProps {
  data: TransactionDetails[]
  loading?: boolean
  error?: boolean
  rowWrapper?: (row: Row<TransactionDetails>, content: JSX.Element) => JSX.Element
}

export function useActivityTableColumns({
  showLoadingSkeleton,
  collapsibleTimeColumn = false,
}: {
  showLoadingSkeleton: boolean
  /** Mobile: the time cell cross-fades to its abbreviated form as the pinned column collapses. */
  collapsibleTimeColumn?: boolean
}): ColumnDef<TransactionDetails, any>[] {
  const { t } = useTranslation()
  const isTouchDevice = useIsTouchDevice()
  const columnHelper = useMemo(() => createColumnHelper<TransactionDetails>(), [])

  return useMemo(
    () => [
      // Time Column
      columnHelper.accessor('addedTime', {
        header: () => (
          <HeaderCell testId={TestID.PortfolioActivityTableHeaderTime} justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.activity.table.column.time')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (showLoadingSkeleton) {
            return <Cell loading={true} justifyContent="flex-start" alignItems="flex-start" />
          }
          return (
            <Cell justifyContent="flex-start" alignItems="flex-start">
              <TimeCell
                timestamp={info.row.original.addedTime}
                showFullDateOnHover={true}
                collapsible={collapsibleTimeColumn}
              />
            </Cell>
          )
        },
        minSize: TIME_COLUMN_SIZE_PX,
        size: TIME_COLUMN_SIZE_PX,
        meta: {
          flexGrow: 0,
          collapsedWidth: COLLAPSED_TIME_COLUMN_SIZE_PX,
        },
      }),

      // Type Column
      columnHelper.accessor((row) => row.typeInfo.type, {
        id: 'type',
        header: () => (
          <HeaderCell testId={TestID.PortfolioActivityTableHeaderType} justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.activity.table.column.type')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (showLoadingSkeleton) {
            return <Cell loading={true} justifyContent="flex-start" />
          }
          return (
            <Cell justifyContent="flex-start">
              <TransactionTypeCell transaction={info.row.original} />
            </Cell>
          )
        },
        minSize: 180,
        size: 180,
        meta: {
          flexGrow: 0,
        },
      }),

      // Amount Column
      columnHelper.display({
        id: 'amount',
        header: () => (
          <HeaderCell testId={TestID.PortfolioActivityTableHeaderAmount} justifyContent="flex-start" minWidth="280px">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.activity.table.column.amount')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (showLoadingSkeleton) {
            return <Cell loading={true} justifyContent="flex-start" />
          }
          return (
            <Cell justifyContent="flex-start">
              <ActivityAmountCell transaction={info.row.original} />
            </Cell>
          )
        },
        minSize: 384,
        size: 384,
        meta: {
          flexGrow: 1,
        },
      }),

      // Address Column
      columnHelper.display({
        id: 'address',
        header: () => (
          <HeaderCell testId={TestID.PortfolioActivityTableHeaderAddress} justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.activity.table.column.address')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          if (showLoadingSkeleton) {
            return <Cell loading={true} justifyContent="flex-start" />
          }
          return (
            <Cell justifyContent="flex-start">
              <ActivityAddressCell transaction={info.row.original} />
            </Cell>
          )
        },
        minSize: 250,
        size: 250,
        meta: {
          flexGrow: 0,
        },
      }),

      columnHelper.display({
        id: 'open-arrow',
        size: 40,
        header: () => <HeaderCell />,
        cell: () => {
          return (
            <Cell loading={showLoadingSkeleton} justifyContent="center">
              <Flex
                opacity={isTouchDevice ? 1 : 0}
                transition="opacity 0.2s ease"
                centered
                $group-hover={{ opacity: 1 }}
              >
                <ArrowRight color="$neutral2" size="$icon.16" />
              </Flex>
            </Cell>
          )
        },
      }),
    ],
    [t, columnHelper, showLoadingSkeleton, isTouchDevice, collapsibleTimeColumn],
  )
}

function ActivityTableInner({ data, loading = false, error = false, rowWrapper }: ActivityTableProps): JSX.Element {
  const showLoadingSkeleton = loading || error

  // Initialize address lookup for batch fetching
  useActivityAddressLookup(data)

  const media = useMedia()
  const columns = useActivityTableColumns({
    showLoadingSkeleton,
    collapsibleTimeColumn: media.lg,
  })

  return (
    <Table
      mobileFullBleed
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      rowWrapper={rowWrapper}
      rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
      compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
      defaultPinnedColumns={['addedTime']}
      maxWidth={1200}
      headerTestId={TestID.PortfolioActivityTableHeader}
      virtualized={true}
      collapsiblePinnedColumnId={media.lg ? 'addedTime' : undefined}
    />
  )
}

export const ActivityTable = memo(ActivityTableInner)
