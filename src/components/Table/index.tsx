import { useWindowSize } from 'hooks/useWindowSize'
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
const StyledRow = styled.tr`
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`
const Box = styled.div<{
  height?: string
  leftMost?: boolean
  rightMost?: boolean
}>`
  maxwidth: 160px;
  height: ${({ height }) => height ?? '64px'};
  padding: 12px;
  padding-left: ${({ leftMost }) => (leftMost ? '20px' : '8px')};
  padding-right: ${({ rightMost }) => (rightMost ? '20px' : '8px')};
  display: flex;
  justify-content: center;
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
  smallHiddenColumns = [],
  mediumHiddenColumns = [],
  largeHiddenColumns = [],
  extraLargeHiddenColumns = [],
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
                    <Box height="52px" leftMost={index === 0} rightMost={index === headerGroup.headers.length - 1}>
                      {column.render('Header')}
                    </Box>
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
                {row.cells.map((cell, index) => {
                  return (
                    <td {...cell.getCellProps()} key={`${row.id}-${cell.column.id}`}>
                      <Box leftMost={index === 0} rightMost={index === row.cells.length - 1}>
                        {cell.render('Cell')}
                      </Box>
                    </td>
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
