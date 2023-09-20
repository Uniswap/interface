import { ArrowChangeDown } from 'components/Icons/ArrowChangeDown'
import { ArrowChangeUp } from 'components/Icons/ArrowChangeUp'
import { useWindowSize } from 'hooks/useWindowSize'
import { Box } from 'nft/components/Box'
import { useEffect } from 'react'
import { Column, IdType, useSortBy, useTable } from 'react-table'
import styled, { useTheme } from 'styled-components'

const Container = styled.div`
  max-height: 600px;
  overflow-y: auto;
  border: 2px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  box-shadow: 2% 2% 10px rgba(0, 0, 0, 0.5);
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`
const StyledHeaderContent = styled.div<{ leftMost: boolean; disabled?: boolean }>`
  padding: 14px 12px 14px 12px;
  text-align: ${({ leftMost }) => (leftMost ? 'left' : 'right')};
  font-weight: 400;
  font-size: 16px;
  line-height: 20px;

  color: ${({ theme }) => theme.neutral2};
  ${({ disabled }) => !disabled && `cursor: pointer;`}
  :hover {
    ${({ theme, disabled }) => !disabled && `opacity: ${theme.opacity.hover};`}
  }
  :active {
    ${({ theme, disabled }) => !disabled && `opacity: ${theme.opacity.click};`}
  }
`
const StyledRow = styled.tr`
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`
const StyledData = styled.td`
  max-width: 160px;
  padding: 2px 6px 2px 6px;
  text-align: right;
  position: relative;
  width: fit-content;
`

interface TableProps<Data extends object> {
  columns: Column<Data>[]
  data: Data[]
  smallHiddenColumns: IdType<Data>[]
  mediumHiddenColumns: IdType<Data>[]
  largeHiddenColumns: IdType<Data>[]
  extraLargeHiddenColumns: IdType<Data>[]
  dataTestId?: string
}

export function Table<Data extends object>({
  columns,
  data,
  smallHiddenColumns,
  mediumHiddenColumns,
  largeHiddenColumns,
  extraLargeHiddenColumns,
  dataTestId,
  ...props
}: TableProps<Data>) {
  const theme = useTheme()
  const { width } = useWindowSize()
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setHiddenColumns } = useTable(
    {
      columns,
      data,
      ...props,
    },
    useSortBy
  )

  useEffect(() => {
    if (!width) return

    if (width <= theme.breakpoint.sm) {
      setHiddenColumns(smallHiddenColumns)
    } else if (width <= theme.breakpoint.md) {
      setHiddenColumns(mediumHiddenColumns)
    } else if (width <= theme.breakpoint.lg) {
      setHiddenColumns(largeHiddenColumns)
    } else {
      setHiddenColumns(extraLargeHiddenColumns)
    }
  }, [
    width,
    setHiddenColumns,
    columns,
    smallHiddenColumns,
    mediumHiddenColumns,
    largeHiddenColumns,
    theme.breakpoint,
    extraLargeHiddenColumns,
  ])

  return (
    <Container>
      <StyledTable {...getTableProps()} data-testid={dataTestId}>
        <thead
          style={{
            position: 'sticky',
            top: '0px',
            zIndex: 1,
            boxShadow: `inset 0 -2px 0 ${theme.surface3}`,
            background: `${theme.surface1}`,
          }}
        >
          {headerGroups.map((headerGroup, headerGroupIndex) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={`header-group-${headerGroupIndex}`}>
              {headerGroup.headers.map((column, index) => {
                return (
                  <th {...column.getHeaderProps(column.getSortByToggleProps())} key={column.id}>
                    <StyledHeaderContent leftMost={index === 0} disabled={column.disableSortBy}>
                      <Box as="span" color="neutral2" position="relative">
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <ArrowChangeUp width="16px" height="16px" style={{ position: 'absolute', top: 3 }} />
                          ) : (
                            <ArrowChangeDown width="16px" height="16px" style={{ position: 'absolute', top: 3 }} />
                          )
                        ) : (
                          ''
                        )}
                      </Box>
                      <Box as="span" paddingLeft={column.isSorted ? '18' : '0'}>
                        {column.render('Header')}
                      </Box>
                    </StyledHeaderContent>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row)

            return (
              <StyledRow {...row.getRowProps()} key={row.id}>
                {row.cells.map((cell) => {
                  return (
                    <StyledData {...cell.getCellProps()} key={`${row.id}-${cell.column.id}`}>
                      {cell.render('Cell')}
                    </StyledData>
                  )
                })}
              </StyledRow>
            )
          })}
        </tbody>
      </StyledTable>
    </Container>
  )
}
