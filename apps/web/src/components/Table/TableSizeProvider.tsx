import { ParentSizeState } from '@visx/responsive/lib/hooks/useParentSize'
import { createContext, useContext } from 'react'

export type TableSizeContextValue = ParentSizeState & {
  /** Sum of leaf column sizes — matches full `DataRow` scroll width. */
  rowContentMinWidthPx: number
}

const defaultTableSizeContextValue: TableSizeContextValue = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  rowContentMinWidthPx: 0,
}

const TableSizeContext = createContext<TableSizeContextValue>(defaultTableSizeContextValue)

export const useTableSize = (): TableSizeContextValue => {
  return useContext(TableSizeContext)
}

export const useTableRowContentMinWidthPx = (): number => {
  return useContext(TableSizeContext).rowContentMinWidthPx
}

export function TableSizeProvider({ children, value }: { children: React.ReactNode; value: TableSizeContextValue }) {
  return <TableSizeContext.Provider value={value}>{children}</TableSizeContext.Provider>
}
