import { createColumnHelper, Row } from '@tanstack/react-table'
import { ActivityAddressCell } from 'components/ActivityTable/ActivityAddressCell'
import { ActivityAmountCell } from 'components/ActivityTable/ActivityAmountCell'
import { TimeCell } from 'components/ActivityTable/TimeCell'
import { TransactionTypeCell } from 'components/ActivityTable/TransactionTypeCell'
import { Table } from 'components/Table'
import { Cell } from 'components/Table/Cell'
import { HeaderCell } from 'components/Table/styled'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

interface ActivityTableProps {
  data: TransactionDetails[]
  loading?: boolean
  error?: boolean
  rowWrapper?: (row: Row<TransactionDetails>, content: JSX.Element) => JSX.Element
}

function _ActivityTable({ data, loading = false, error = false, rowWrapper }: ActivityTableProps): JSX.Element {
  const { t } = useTranslation()
  const columnHelper = useMemo(() => createColumnHelper<TransactionDetails>(), [])
  const showLoadingSkeleton = loading || error

  const columns = useMemo(
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
            return <Cell loading={true} justifyContent="flex-start" />
          }
          return (
            <Cell justifyContent="flex-start">
              <TimeCell timestamp={info.row.original.addedTime} />
            </Cell>
          )
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
        minSize: 280,
        size: 300,
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
      }),
    ],
    [t, columnHelper, showLoadingSkeleton],
  )

  return <Table columns={columns} data={data} loading={loading} error={error} v2={true} rowWrapper={rowWrapper} />
}

export const ActivityTable = memo(_ActivityTable)
