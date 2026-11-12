import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// The chart block height the user dragged to with the chart ↔ positions resize handle, in px, stored
// raw. Persisted so it survives reloads; undefined = never dragged, and the layout uses its default
// split. Clamped at read time so it keeps tracking the live viewport.
interface MarginTerminalResizeState {
  chartBlockHeight: number | undefined
  setChartBlockHeight: (height: number) => void
}

export const useMarginTerminalResizeStore = create<MarginTerminalResizeState>()(
  persist(
    (set) => ({
      chartBlockHeight: undefined,
      setChartBlockHeight: (height) => set({ chartBlockHeight: height }),
    }),
    {
      name: 'margin.chartBlockHeight',
      // localStorage is user-editable: fall back to the default split rather than lay out a bad height.
      merge: (persisted, current) => {
        const height = (persisted as Partial<MarginTerminalResizeState> | undefined)?.chartBlockHeight
        return { ...current, chartBlockHeight: typeof height === 'number' && height > 0 ? height : undefined }
      },
    },
  ),
)
