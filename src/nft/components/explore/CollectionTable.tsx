import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { CellProps, Column, Row } from 'react-table'

import { CollectionTableColumn } from '../../types'
import { ChangeCell, CollectionTitleCell, DiscreteNumberCell, EthCell, VolumeCell } from './Cells/Cells'
import { Table } from './Table'

export enum ColumnHeaders {
  Volume = 'Volume',
  VolumeChange = 'Volume change',
  Floor = 'Floor',
  FloorChange = 'Floor change',
  Sales = 'Sales',
  Items = 'Items',
  Owners = 'Owners',
}

const compareFloats = (a: number, b: number): 1 | -1 => {
  return Math.round(a * 100000) >= Math.round(b * 100000) ? 1 : -1
}

const CollectionTable = ({ data }: { data: CollectionTableColumn[] }) => {
  const floorSort = useMemo(() => {
    return (rowA: Row<CollectionTableColumn>, rowB: Row<CollectionTableColumn>) => {
      const aFloor = BigNumber.from(rowA.original.floor.value)
      const bFloor = BigNumber.from(rowB.original.floor.value)

      return aFloor.gte(bFloor) ? 1 : -1
    }
  }, [])

  const floorChangeSort = useMemo(() => {
    return (rowA: Row<CollectionTableColumn>, rowB: Row<CollectionTableColumn>) => {
      return compareFloats(rowA.original.floor.change, rowB.original.floor.change)
    }
  }, [])

  const volumeSort = useMemo(() => {
    return (rowA: Row<CollectionTableColumn>, rowB: Row<CollectionTableColumn>) => {
      return compareFloats(rowA.original.volume.value, rowB.original.volume.value)
    }
  }, [])

  const volumeChangeSort = useMemo(() => {
    return (rowA: Row<CollectionTableColumn>, rowB: Row<CollectionTableColumn>) => {
      return compareFloats(rowA.original.volume.change, rowB.original.volume.change)
    }
  }, [])

  const columns: Column<CollectionTableColumn>[] = useMemo(
    () => [
      {
        Header: 'Collection name',
        accessor: 'collection',
        Cell: CollectionTitleCell,
        disableSortBy: true,
      },
      {
        id: ColumnHeaders.Floor,
        Header: ColumnHeaders.Floor,
        accessor: ({ floor }) => floor.value,
        sortType: floorSort,
        Cell: function ethCell(cell: CellProps<CollectionTableColumn>) {
          return (
            <EthCell
              value={cell.row.original.floor.value}
              denomination={cell.row.original.denomination}
              usdPrice={cell.row.original.usdPrice}
            />
          )
        },
      },
      {
        id: ColumnHeaders.FloorChange,
        Header: ColumnHeaders.FloorChange,
        accessor: ({ floor }) => floor.value,
        sortDescFirst: true,
        sortType: floorChangeSort,
        Cell: function changeCell(cell: CellProps<CollectionTableColumn>) {
          return <ChangeCell change={cell.row.original.floor.change} />
        },
      },
      {
        id: ColumnHeaders.Volume,
        Header: ColumnHeaders.Volume,
        accessor: ({ volume }) => volume.value,
        sortDescFirst: true,
        sortType: volumeSort,
        Cell: function volumeCell(cell: CellProps<CollectionTableColumn>) {
          return (
            <VolumeCell
              value={cell.row.original.volume.value}
              denomination={cell.row.original.denomination}
              usdPrice={cell.row.original.usdPrice}
            />
          )
        },
      },
      {
        id: ColumnHeaders.VolumeChange,
        Header: ColumnHeaders.VolumeChange,
        accessor: ({ volume }) => volume.value,
        sortDescFirst: true,
        sortType: volumeChangeSort,
        Cell: function changeCell(cell: CellProps<CollectionTableColumn>) {
          return <ChangeCell change={cell.row.original.volume.change} />
        },
      },
      {
        id: ColumnHeaders.Items,
        Header: ColumnHeaders.Items,
        accessor: 'totalSupply',
        sortDescFirst: true,
        Cell: function discreteNumberCell(cell: CellProps<CollectionTableColumn>) {
          return <DiscreteNumberCell value={{ value: cell.row.original.totalSupply }} />
        },
      },
      {
        Header: ColumnHeaders.Owners,
        accessor: ({ owners }) => owners.value,
        sortDescFirst: true,
        Cell: function discreteNumberCell(cell: CellProps<CollectionTableColumn>) {
          return <DiscreteNumberCell value={cell.row.original.owners} />
        },
      },
    ],
    [floorChangeSort, floorSort, volumeChangeSort, volumeSort]
  )
  return (
    <>
      <Table
        smallHiddenColumns={[
          ColumnHeaders.Items,
          ColumnHeaders.FloorChange,
          ColumnHeaders.Volume,
          ColumnHeaders.VolumeChange,
          ColumnHeaders.Owners,
        ]}
        mediumHiddenColumns={[
          ColumnHeaders.Items,
          ColumnHeaders.FloorChange,
          ColumnHeaders.VolumeChange,
          ColumnHeaders.Owners,
        ]}
        largeHiddenColumns={[ColumnHeaders.Items, ColumnHeaders.Owners]}
        {...{ data, columns }}
      />
    </>
  )
}

export default CollectionTable
