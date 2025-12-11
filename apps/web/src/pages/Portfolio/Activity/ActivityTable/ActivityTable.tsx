import { ColumnDef, createColumnHelper, Row } from '@tanstack/react-table'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { ActivityAddressCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAddressCell'
import { useActivityAddressLookup } from 'pages/Portfolio/Activity/ActivityTable/ActivityAddressLookupStore'
import { ActivityAmountCell } from 'pages/Portfolio/Activity/ActivityTable/ActivityAmountCell/ActivityAmountCell'
import { TimeCell } from 'pages/Portfolio/Activity/ActivityTable/TimeCell'
import { TransactionTypeCell } from 'pages/Portfolio/Activity/ActivityTable/TransactionTypeCell'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useIsTouchDevice } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

interface ActivityTableProps {
  data: TransactionDetails[]
  loading?: boolean
  error?: boolean
  rowWrapper?: (row: Row<TransactionDetails>, content: JSX.Element) => JSX.Element
}

export function useActivityTableColumns(showLoadingSkeleton: boolean): ColumnDef<TransactionDetails, any>[] {
  const { t } = useTranslation()
  const isTouchDevice = useIsTouchDevice()
  const columnHelper = useMemo(() => createColumnHelper<TransactionDetails>(), [])

  return useMemo(
    () => [
      // Time Column
      columnHelper.accessor('addedTime', {
        header: () => (
          <HeaderCell justifyContent="flex-start">
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
              <TimeCell timestamp={info.row.original.addedTime} showFullDateOnHover={true} />
            </Cell>
          )
        },
        minSize: 160,
        size: 160,
        meta: {
          flexGrow: 0,
        },
      }),

      // Type Column
      columnHelper.accessor((row) => row.typeInfo.type, {
        id: 'type',
        header: () => (
          <HeaderCell justifyContent="flex-start">
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
          <HeaderCell justifyContent="flex-start" minWidth="280px">
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
          <HeaderCell justifyContent="flex-start">
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
    [t, columnHelper, showLoadingSkeleton, isTouchDevice],
  )
}

function _ActivityTable({ data, loading = false, error = false, rowWrapper }: ActivityTableProps): JSX.Element {
  const showLoadingSkeleton = loading || error

  // Initialize address lookup for batch fetching
  useActivityAddressLookup(data)

  const columns = useActivityTableColumns(showLoadingSkeleton)

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      error={error}
      v2={true}
      rowWrapper={rowWrapper}
      rowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
      compactRowHeight={PORTFOLIO_TABLE_ROW_HEIGHT}
      defaultPinnedColumns={['addedTime']}
      maxWidth={1200}
    />
  )
}

export const ActivityTable = memo(_ActivityTable)
