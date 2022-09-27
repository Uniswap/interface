import { CellProps, Column } from 'react-table'

import { CollectionTableColumn } from '../../types'
import {
  CollectionTitleCell,
  CommaWithDayChange,
  EthWithDayChange,
  WeiWithDayChange,
  WithCommaCell,
} from './Cells/Cells'
import { Table } from './Table'

export enum ColumnHeaders {
  Volume = 'Volume',
  Floor = 'Floor',
  Sales = 'Sales',
  Items = 'Items',
  Owners = 'Owners',
}

const columns: Column<CollectionTableColumn>[] = [
  {
    Header: 'Collection',
    accessor: 'collection',
    Cell: CollectionTitleCell,
  },
  {
    id: ColumnHeaders.Volume,
    Header: ColumnHeaders.Volume,
    accessor: ({ volume }) => volume.value,
    sortDescFirst: true,
    Cell: function EthDayChanget(cell: CellProps<CollectionTableColumn>) {
      return <EthWithDayChange value={cell.row.original.volume} />
    },
  },
  {
    id: ColumnHeaders.Floor,
    Header: ColumnHeaders.Floor,
    accessor: ({ floor }) => floor.value,
    sortDescFirst: true,
    Cell: function weiDayChange(cell: CellProps<CollectionTableColumn>) {
      return <WeiWithDayChange value={cell.row.original.floor} />
    },
  },
  {
    id: ColumnHeaders.Sales,
    Header: ColumnHeaders.Sales,
    accessor: 'sales',
    sortDescFirst: true,
    Cell: function withCommaCell(cell: CellProps<CollectionTableColumn>) {
      return <WithCommaCell value={{ value: cell.row.original.sales }} />
    },
  },
  {
    id: ColumnHeaders.Items,
    Header: ColumnHeaders.Items,
    accessor: 'totalSupply',
    sortDescFirst: true,
    Cell: function withCommaCell(cell: CellProps<CollectionTableColumn>) {
      return <WithCommaCell value={{ value: cell.row.original.totalSupply }} />
    },
  },
  {
    Header: ColumnHeaders.Owners,
    accessor: ({ owners }) => owners.value,
    sortDescFirst: true,
    Cell: function commaDayChange(cell: CellProps<CollectionTableColumn>) {
      return <CommaWithDayChange value={cell.row.original.owners} />
    },
  },
]

const CollectionTable = ({ data }: { data: CollectionTableColumn[] }) => {
  return (
    <>
      <Table
        hiddenColumns={[ColumnHeaders.Volume, ColumnHeaders.Owners, ColumnHeaders.Items, ColumnHeaders.Sales]}
        {...{ data, columns }}
      />
    </>
  )
}

export default CollectionTable
