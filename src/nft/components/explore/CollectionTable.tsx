import { CellProps, Column } from 'react-table'

import { CollectionTableColumn } from '../../types'
import { ChangeCell, CollectionTitleCell, CommaWithDayChange, EthCell, VolumeCell } from './Cells/Cells'
import { Table } from './Table'

export enum ColumnHeaders {
  Volume = 'Volume',
  VolumeChange = 'VolumeChange',
  Floor = 'Floor',
  FloorChange = 'Floor change',
  Sales = 'Sales',
  Items = 'Items',
  Owners = 'Unique Owners',
}

const columns: Column<CollectionTableColumn>[] = [
  {
    Header: 'Collection name',
    accessor: 'collection',
    Cell: CollectionTitleCell,
  },
  {
    id: ColumnHeaders.Floor,
    Header: ColumnHeaders.Floor,
    accessor: ({ floor }) => floor.value,
    sortDescFirst: true,
    Cell: function ethCell(cell: CellProps<CollectionTableColumn>) {
      return <EthCell value={cell.row.original.floor.value} />
    },
  },
  {
    id: ColumnHeaders.FloorChange,
    Header: ColumnHeaders.FloorChange,
    accessor: ({ floor }) => floor.value,
    sortDescFirst: true,
    Cell: function changeCell(cell: CellProps<CollectionTableColumn>) {
      return <ChangeCell change={cell.row.original.floor.change} />
    },
  },
  {
    id: ColumnHeaders.Volume,
    Header: ColumnHeaders.Volume,
    accessor: ({ volume }) => volume.value,
    sortDescFirst: true,
    Cell: function volumeCell(cell: CellProps<CollectionTableColumn>) {
      return <VolumeCell value={cell.row.original.volume} />
    },
  },
  {
    id: ColumnHeaders.VolumeChange,
    Header: ColumnHeaders.VolumeChange,
    accessor: ({ volume }) => volume.value,
    sortDescFirst: true,
    Cell: function changeCell(cell: CellProps<CollectionTableColumn>) {
      return <ChangeCell change={cell.row.original.volume.change} />
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
