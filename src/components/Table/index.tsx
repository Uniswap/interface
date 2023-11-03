import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  overflow: hidden;
`
const TableContainer = styled.div`
  overflow: auto; // Enable horizontal scroll on full table
`
const TableHeadContainer = styled.div`
  // Enable horizontal scroll on the header but hide scrollbar
  overflow-x: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`
const TableBodyContainer = styled.div`
  max-height: 550px;
  overflow-y: auto; // Enable vertical scroll only on table body
`
const TableSection = styled.table`
  border-collapse: collapse;
  box-sizing: border-box;
`
const TableHead = styled.thead`
  display: table;
  width: 100%;
`
const TableBody = styled.tbody`
  display: table;
  width: 100%;
`
const TableRow = styled.tr`
  :hover {
    background: ${({ theme }) => theme.surface3};
  }
`
export const TableCell = styled.div<{ alignRight?: boolean }>`
  width: 100%;
  display: flex;
  padding: 12px 16px;
  white-space: nowrap;
  justify-content: ${({ alignRight }) => (alignRight ? 'flex-end' : 'flex-start')};
`
const TableHeader = styled.th<{ width: number }>`
  min-width: ${({ width }) => width}px;
  padding: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`
const TableData = styled.td<{ width: number }>`
  min-width: ${({ width }) => width}px;
  padding: 8px;
  box-sizing: border-box;
`
export function Table<Data extends object>({ columns, data }: { columns: ColumnDef<Data>[]; data: Data[] }) {
  const headRef = useRef<HTMLTableElement>(null)
  const bodyRef = useRef<HTMLTableElement>(null)
  const [headerWidths, setHeaderWidths] = useState<number[]>(new Array(columns.length).fill(0))
  const [dataWidths, setDataWidths] = useState<number[]>(new Array(columns.length).fill(0))

  useLayoutEffect(() => {
    const ths = document.querySelectorAll('thead th')
    const tds = document.querySelectorAll('tbody tr:first-child td')
    setHeaderWidths(Array.from(ths).map((th) => (th as HTMLElement).offsetWidth))
    setDataWidths(Array.from(tds).map((td) => (td as HTMLElement).offsetWidth))
  }, [])

  const syncScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const tableElement = e.target as HTMLTableElement
    if (headRef.current && bodyRef.current) {
      headRef.current.scrollLeft = tableElement.scrollLeft
      bodyRef.current.scrollLeft = tableElement.scrollLeft
    }
  }

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Wrapper>
      <TableContainer onScroll={(e: React.UIEvent<HTMLDivElement>) => syncScroll(e)}>
        <TableHeadContainer ref={headRef} onScroll={(e: React.UIEvent<HTMLDivElement>) => syncScroll(e)}>
          <TableSection>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <TableHeader key={header.id} width={Math.max(headerWidths[index], dataWidths[index])}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHeader>
                  ))}
                </tr>
              ))}
            </TableHead>
          </TableSection>
        </TableHeadContainer>
        <TableBodyContainer ref={bodyRef} onScroll={(e: React.UIEvent<HTMLDivElement>) => syncScroll(e)}>
          <TableSection>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, index) => (
                    <TableData key={cell.id} width={Math.max(headerWidths[index], dataWidths[index])}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableData>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </TableSection>
        </TableBodyContainer>
      </TableContainer>
    </Wrapper>
  )
}
