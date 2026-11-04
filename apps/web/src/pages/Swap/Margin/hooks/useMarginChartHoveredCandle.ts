import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import type { PriceChartData } from '~/components/Charts/PriceChart'

interface MarginChartHoveredCandleState {
  candle: PriceChartData | undefined
}

// Module store, not pane state: the crosshair fires on every mouse move, and routing that through the
// chart pane would re-render the whole chart subtree. Only the OHLC legend subscribes.
const marginChartHoveredCandleStore = createStore<MarginChartHoveredCandleState>()(() => ({
  candle: undefined,
}))

export function useMarginChartHoveredCandle(): PriceChartData | undefined {
  return useStore(marginChartHoveredCandleStore, (s) => s.candle)
}

// Compares OHLC as well as time: the live trailing candle, and an interval switch landing on a shared
// boundary, both hand over the same time with new prices.
function isSameCandle(a: PriceChartData | undefined, b: PriceChartData | undefined): boolean {
  return a?.time === b?.time && a?.open === b?.open && a?.high === b?.high && a?.low === b?.low && a?.close === b?.close
}

// Unchanged-candle moves are dropped so a mouse-move flood inside one bar never wakes subscribers.
export function setMarginChartHoveredCandle(candle: PriceChartData | undefined): void {
  if (!isSameCandle(marginChartHoveredCandleStore.getState().candle, candle)) {
    marginChartHoveredCandleStore.setState({ candle })
  }
}
