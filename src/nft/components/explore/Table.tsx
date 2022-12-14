import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { LoadingBubble } from 'components/Tokens/loading'
import { useWindowSize } from 'hooks/useWindowSize'
import { useIsMobile } from 'nft/hooks'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Column, ColumnInstance, HeaderGroup, IdType, useSortBy, useTable } from 'react-table'
import styled, { useTheme } from 'styled-components/macro'
import { GlowEffect, ThemedText } from 'theme'

import { Box } from '../../components/Box'
import { CollectionTableColumn } from '../../types'
import { ArrowRightIcon } from '../icons'
import { ColumnHeaders } from './CollectionTable'
import * as styles from './Explore.css'

// Default table cell max width
const CELL_WIDTH = '160px'
// Collection Name cell max widths
const MOBILE_CELL_WIDTH = '240px'
const DESKTOP_CELL_WIDTH = '360px'

const RankCellContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 24px;
  gap: 12px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-left: 8px;
  }
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

const StyledHeader = styled.th<{ disabled?: boolean }>`
  ${({ disabled }) => !disabled && `cursor: pointer;`}

  :hover {
    ${({ theme, disabled }) => !disabled && `opacity: ${theme.opacity.hover};`}
  }

  :active {
    ${({ theme, disabled }) => !disabled && `opacity: ${theme.opacity.click};`}
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

const DEFAULT_TRENDING_TABLE_QUERY_AMOUNT = 10

interface TableProps<D extends Record<string, unknown>> {
  columns: Column<CollectionTableColumn>[]
  data: CollectionTableColumn[]
  smallHiddenColumns: IdType<D>[]
  mediumHiddenColumns: IdType<D>[]
  largeHiddenColumns: IdType<D>[]
}
export function Table<D extends Record<string, unknown>>({
  columns,
  data,
  smallHiddenColumns,
  mediumHiddenColumns,
  largeHiddenColumns,
  ...props
}: TableProps<D>) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const { width } = useWindowSize()
  const isMobile = useIsMobile()

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setHiddenColumns, visibleColumns } =
    useTable(
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

    if (width <= theme.breakpoint.sm) {
      setHiddenColumns(smallHiddenColumns)
    } else if (width <= theme.breakpoint.md) {
      setHiddenColumns(mediumHiddenColumns)
    } else if (width <= theme.breakpoint.lg) {
      setHiddenColumns(largeHiddenColumns)
    } else {
      setHiddenColumns([])
    }
  }, [width, setHiddenColumns, columns, smallHiddenColumns, mediumHiddenColumns, largeHiddenColumns, theme.breakpoint])

  if (data.length === 0) {
    return <LoadingTable headerGroups={headerGroups} visibleColumns={visibleColumns} {...getTableProps()} />
  }

  return (
    <GlowEffect>
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
                      paddingLeft: index === 0 ? (isMobile ? '16px' : '52px') : 0,
                    }}
                    disabled={column.disableSortBy}
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
              <TraceEvent
                events={[BrowserEvent.onClick]}
                name={EventName.NFT_TRENDING_ROW_SELECTED}
                properties={{ collection_address: row.original.collection.address, chain_id: chainId }}
                element={ElementName.NFT_TRENDING_ROW}
                key={i}
              >
                <StyledRow
                  {...row.getRowProps()}
                  key={row.id}
                  onClick={() => navigate(`/nfts/collection/${row.original.collection.address}`)}
                  data-testid="nft-trending-collection"
                >
                  {row.cells.map((cell, cellIndex) => {
                    return (
                      <td
                        className={styles.td}
                        {...cell.getCellProps()}
                        key={cellIndex}
                        style={{
                          maxWidth: cellIndex === 0 ? (isMobile ? MOBILE_CELL_WIDTH : DESKTOP_CELL_WIDTH) : CELL_WIDTH,
                        }}
                      >
                        {cellIndex === 0 ? (
                          <RankCellContainer>
                            {!isMobile && (
                              <ThemedText.BodySecondary fontSize="14px" lineHeight="20px">
                                {i + 1}
                              </ThemedText.BodySecondary>
                            )}
                            {cell.render('Cell')}
                          </RankCellContainer>
                        ) : (
                          cell.render('Cell')
                        )}
                      </td>
                    )
                  })}
                </StyledRow>
              </TraceEvent>
            )
          })}
        </tbody>
      </table>
    </GlowEffect>
  )
}

interface LoadingTableProps {
  headerGroups: HeaderGroup<CollectionTableColumn>[]
  visibleColumns: ColumnInstance<CollectionTableColumn>[]
}

function LoadingTable({ headerGroups, visibleColumns, ...props }: LoadingTableProps) {
  return (
    <GlowEffect>
      <table {...props} className={styles.table}>
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
                    disabled={index === 0}
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
        <tbody {...props}>
          {[...Array(DEFAULT_TRENDING_TABLE_QUERY_AMOUNT)].map((_, index) => (
            <StyledLoadingRow key={index}>
              {[...Array(visibleColumns.length)].map((_, cellIndex) => {
                return (
                  <td className={styles.loadingTd} key={cellIndex}>
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
    </GlowEffect>
  )
}
