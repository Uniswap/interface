import clsx from 'clsx'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Column, IdType, useSortBy, useTable } from 'react-table'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { isMobile } from 'utils/userAgent'

import { Box } from '../../components/Box'
import { CollectionTableColumn } from '../../types'
import { ArrowRightIcon } from '../icons'
import { ColumnHeaders } from './CollectionTable'
import * as styles from './Explore.css'

const RankCellContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 24px;
  gap: 12px;
`

const StyledRow = styled.tr`
  cursor: pointer;
  :hover {
    background: ${({ theme }) => theme.stateOverlayHover};
  }
  :active {
    background: ${({ theme }) => theme.stateOverlayPressed};
  }
`

const StyledHeader = styled.th<{ isFirstHeader: boolean }>`
  ${({ isFirstHeader }) => !isFirstHeader && `cursor: pointer;`}

  :hover {
    ${({ theme, isFirstHeader }) => !isFirstHeader && `opacity: ${theme.opacity.hover};`}
  }

  :active {
    ${({ theme, isFirstHeader }) => !isFirstHeader && `opacity: ${theme.opacity.click};`}
  }
`

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
                <StyledHeader
                  className={styles.th}
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  style={{
                    textAlign: index === 0 ? 'left' : 'right',
                    paddingLeft: index === 0 ? '52px' : 0,
                  }}
                  isFirstHeader={index === 0}
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
                </StyledHeader>
              )
            })}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)

          return (
            <StyledRow
              {...row.getRowProps()}
              key={i}
              onClick={() => navigate(`/nfts/collection/${row.original.collection.address}`)}
            >
              {row.cells.map((cell, cellIndex) => {
                return (
                  <td className={clsx(styles.td, classNames?.td)} {...cell.getCellProps()} key={cellIndex}>
                    {cellIndex === 0 ? (
                      <RankCellContainer>
                        <ThemedText.BodySecondary fontSize="14px" lineHeight="20px">
                          {i + 1}
                        </ThemedText.BodySecondary>
                        {cell.render('Cell')}
                      </RankCellContainer>
                    ) : (
                      cell.render('Cell')
                    )}
                  </td>
                )
              })}
            </StyledRow>
          )
        })}
      </tbody>
    </table>
  )
}
