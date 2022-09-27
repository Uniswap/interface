import clsx from 'clsx'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Column, IdType, useSortBy, useTable } from 'react-table'
import { isMobile } from 'utils/userAgent'

import { Box } from '../../components/Box'
import { CollectionTableColumn } from '../../types'
import { ArrowRightIcon } from '../icons'
import { ColumnHeaders } from './CollectionTable'
import * as styles from './Explore.css'

interface TableProps<D extends Record<string, unknown>> {
  columns: Column<CollectionTableColumn>[]
  data: CollectionTableColumn[]
  hiddenColumns: IdType<D>[]
  classNames?: {
    td: string
  }
}

export function Table<D extends Record<string, unknown>>({
  columns,
  data,
  hiddenColumns,
  classNames,
  ...props
}: TableProps<D>) {
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setHiddenColumns } = useTable(
    {
      columns,
      data,
      initialState: {
        sortBy: [
          {
            desc: true,
            id: ColumnHeaders.Volume,
          },
        ],
      },
      ...props,
    },
    useSortBy
  )

  const navigate = useNavigate()

  useEffect(() => {
    if (hiddenColumns && isMobile) {
      setHiddenColumns(hiddenColumns)
    } else {
      setHiddenColumns([])
    }
  }, [hiddenColumns, setHiddenColumns])

  return (
    <table {...getTableProps()} className={styles.table}>
      <thead className={styles.thead}>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
            {headerGroup.headers.map((column, index) => {
              return (
                <th
                  className={styles.th}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  style={{
                    textAlign: index === 0 ? 'left' : 'right',
                    paddingLeft: index === 0 ? '52px' : 0,
                  }}
                  key={index}
                >
                  <Box as="span" color="accentAction" position="relative">
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <ArrowRightIcon style={{ transform: 'rotate(90deg)', position: 'absolute' }} />
                      ) : (
                        <ArrowRightIcon style={{ transform: 'rotate(-90deg)', position: 'absolute' }} />
                      )
                    ) : (
                      ''
                    )}
                  </Box>
                  <Box as="span" paddingLeft={column.isSorted ? '18' : '0'}>
                    {column.render('Header')}
                  </Box>
                </th>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)

          return (
            <tr
              className={styles.tr}
              {...row.getRowProps()}
              key={i}
              onClick={() => navigate(`/nfts/collection/${row.original.collection.address}`)}
            >
              {row.cells.map((cell, cellIndex) => {
                return (
                  <td className={clsx(styles.td, classNames?.td)} {...cell.getCellProps()} key={cellIndex}>
                    {cellIndex === 0 ? <span className={styles.rank}>{i + 1}</span> : null}
                    {cell.render('Cell')}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
