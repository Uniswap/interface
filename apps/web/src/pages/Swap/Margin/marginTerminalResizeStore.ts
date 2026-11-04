import { create } from 'zustand'

// The chart block height the user dragged to with the chart ↔ positions resize handle, in px, stored
// raw. Module-level so it survives leaving and re-entering the Margin tab; undefined = never dragged,
// and the layout uses its default split. Clamped at read time so it keeps tracking the live viewport.
interface MarginTerminalResizeState {
  chartBlockHeight: number | undefined
  setChartBlockHeight: (height: number) => void
}

export const useMarginTerminalResizeStore = create<MarginTerminalResizeState>((set) => ({
  chartBlockHeight: undefined,
  setChartBlockHeight: (height) => set({ chartBlockHeight: height }),
}))
