import { CellContext, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { CellContainer, DataRow } from 'components/Table/styled'
import { getColumnSizingStyles } from 'components/Table/utils'
import { useActivityTableColumns } from 'pages/Portfolio/Activity/ActivityTable/ActivityTable'
import { PORTFOLIO_TABLE_ROW_HEIGHT } from 'pages/Portfolio/constants'
import { memo } from 'react'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

function _PaginationSkeletonRow(): JSX.Element {
  // Memoize columns - they only depend on loading state which is always true here
  const skeletonColumns = useActivityTableColumns(true)

  // Create table instance - columns are memoized so this will be stable
  const skeletonTable = useReactTable({
    columns: skeletonColumns,
    data: [],
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataRow v2={true} height={PORTFOLIO_TABLE_ROW_HEIGHT}>
      {skeletonTable.getAllColumns().map((column) => (
        <CellContainer key={column.id} style={getColumnSizingStyles(column)}>
          {flexRender(column.columnDef.cell, {} as CellContext<TransactionDetails, any>)}
        </CellContainer>
      ))}
    </DataRow>
  )
}

export const PaginationSkeletonRow = memo(_PaginationSkeletonRow)
