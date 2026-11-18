import { createContext, useContext, useMemo, type ReactNode } from 'react'

export interface MarginMorphState {
  // True once the swap→terminal geometry morph has settled, so the chart pane may
  // mount lightweight-charts without competing with the reflow.
  morphSettled: boolean
}

// Default `true` so <MarginChartPane> is safe outside a provider (tests / isolated
// render): the chart shows as soon as data + size resolve, with no bridge delay.
const MarginMorphContext = createContext<MarginMorphState>({ morphSettled: true })

export function MarginMorphProvider({
  morphSettled,
  children,
}: {
  morphSettled: boolean
  children: ReactNode
}): JSX.Element {
  const value = useMemo(() => ({ morphSettled }), [morphSettled])
  return <MarginMorphContext.Provider value={value}>{children}</MarginMorphContext.Provider>
}

export function useMarginMorph(): MarginMorphState {
  return useContext(MarginMorphContext)
}
