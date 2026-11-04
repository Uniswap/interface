import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface MarginMorphState {
  // True once the swap→terminal geometry morph has settled, so the chart pane may
  // mount lightweight-charts without competing with the reflow.
  morphSettled: boolean
  // The positions table's `maxHeight` in the terminal, where the chart column scrolls and the table
  // body is capped at a column of rows. Undefined elsewhere: the table follows the page.
  tableMaxHeight?: number
}

// Default `true` so <MarginChartPane> is safe outside a provider (tests / isolated
// render): the chart shows as soon as data + size resolve, with no bridge delay.
const MarginMorphContext = createContext<MarginMorphState>({ morphSettled: true })

export function MarginMorphProvider({
  morphSettled,
  tableMaxHeight,
  children,
}: {
  morphSettled: boolean
  tableMaxHeight?: number
  children: ReactNode
}): JSX.Element {
  const value = useMemo(() => ({ morphSettled, tableMaxHeight }), [morphSettled, tableMaxHeight])
  return <MarginMorphContext.Provider value={value}>{children}</MarginMorphContext.Provider>
}

export function useMarginMorph(): MarginMorphState {
  return useContext(MarginMorphContext)
}
