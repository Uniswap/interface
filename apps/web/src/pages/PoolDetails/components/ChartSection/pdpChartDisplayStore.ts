import { create } from 'zustand'

/**
 * How the pool page's Liquidity tab draws its bars under the PDP revamp: off draws every tick spacing (full
 * granularity, reading as a smooth curve until zoomed in), on groups ticks into the chart's existing buckets.
 * Module-scoped on purpose: the choice holds as you move between pools, for the session, and isn't persisted.
 */
export const usePdpChartDisplayStore = create<{
  groupTicks: boolean
  setGroupTicks: (groupTicks: boolean) => void
}>()((set) => ({
  groupTicks: false,
  setGroupTicks: (groupTicks) => set({ groupTicks }),
}))
