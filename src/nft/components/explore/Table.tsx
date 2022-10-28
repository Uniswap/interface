import clsx from 'clsx'
import { LoadingBubble } from 'components/Tokens/loading'
import { useWindowSize } from 'hooks/useWindowSize'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Column, useSortBy, useTable } from 'react-table'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

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

const StyledLoadingRow = styled.tr`
  height: 80px;
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

const StyledLoadingHolder = styled.div`
  display: flex;
  width: 100%;
  justify-content: end;
  align-items: center;
`

const StyledCollectionNameHolder = styled.div`
  display: flex;
  margin-left: 24px;
  gap: 8px;
  align-items: center;
`

const StyledImageHolder = styled(LoadingBubble)`
  width: 36px;
  height: 36px;
  border-radius: 36px;
`

const StyledRankHolder = styled(LoadingBubble)`
  width: 8px;
  height: 16px;
  margin-right: 12px;
`

const DEFAULT_ASSET_QUERY_AMOUNT = 10
const MAX_COLUMNS = 7

interface TableProps<D extends Record<string, unknown>> {
  columns: Column<CollectionTableColumn>[]
  data: CollectionTableColumn[]
  classNames?: {
    td: string
  }
}

export function Table<D extends Record<string, unknown>>({ columns, data, classNames, ...props }: TableProps<D>) {
  const theme = useTheme()
  const { width } = useWindowSize()
  const [maxCols, setMaxCols] = useState(MAX_COLUMNS)

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
    if (!width) return

    if (width < theme.breakpoint.sm) {
      setHiddenColumns([
        ColumnHeaders.Items,
        ColumnHeaders.FloorChange,
        ColumnHeaders.Volume,
        ColumnHeaders.VolumeChange,
        ColumnHeaders.Owners,
      ])
      setMaxCols(MAX_COLUMNS - 5)
    } else if (width < theme.breakpoint.md) {
      setHiddenColumns([
        ColumnHeaders.Items,
        ColumnHeaders.FloorChange,
        ColumnHeaders.VolumeChange,
        ColumnHeaders.Owners,
      ])
      setMaxCols(MAX_COLUMNS - 4)
    } else if (width < theme.breakpoint.lg) {
      setHiddenColumns([ColumnHeaders.Items, ColumnHeaders.Owners])
      setMaxCols(MAX_COLUMNS - 2)
    } else {
      setHiddenColumns([])
      setMaxCols(MAX_COLUMNS)
    }
  }, [width, setHiddenColumns, theme.breakpoint])

  if (data.length === 0) {
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
          {[...Array(DEFAULT_ASSET_QUERY_AMOUNT)].map((_, index) => (
            <StyledLoadingRow key={index}>
              {[...Array(maxCols)].map((_, cellIndex) => {
                return (
                  <td className={clsx(styles.loadingTd, classNames?.td)} key={cellIndex}>
                    {cellIndex === 0 ? (
                      <StyledCollectionNameHolder>
                        <StyledRankHolder />
                        <StyledImageHolder />
                        <LoadingBubble />
                      </StyledCollectionNameHolder>
                    ) : (
                      <StyledLoadingHolder>
                        <LoadingBubble />
                      </StyledLoadingHolder>
                    )}
                  </td>
                )
              })}
            </StyledLoadingRow>
          ))}
        </tbody>
      </table>
    )
  }

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
