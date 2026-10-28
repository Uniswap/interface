import { ParentSizeState } from '@visx/responsive/lib/hooks/useParentSize'
import { createContext, useContext, type ReactNode } from 'react'

const defaultTableSize: ParentSizeState = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
}

const TableSizeContext = createContext<ParentSizeState>(defaultTableSize)

const TableRowContentMinWidthContext = createContext<string | undefined>(undefined)

export const useTableSize = (): ParentSizeState => {
  return useContext(TableSizeContext)
}

/** CSS min width of a row's cells (see `getRowContentMinWidthCss`). */
export const useTableRowContentMinWidthCss = (): string => {
  const value = useContext(TableRowContentMinWidthContext)
  if (value === undefined) {
    throw new Error('useTableRowContentMinWidthCss must be used within TableSizeProvider')
  }
  return value
}

export function TableSizeProvider({
  children,
  size,
  rowContentMinWidthCss,
}: {
  children: ReactNode
  size: ParentSizeState
  rowContentMinWidthCss: string
}): JSX.Element {
  return (
    <TableSizeContext.Provider value={size}>
      <TableRowContentMinWidthContext.Provider value={rowContentMinWidthCss}>
        {children}
      </TableRowContentMinWidthContext.Provider>
    </TableSizeContext.Provider>
  )
}
