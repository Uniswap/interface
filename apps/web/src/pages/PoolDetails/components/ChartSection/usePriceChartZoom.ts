import { useMemo, useRef, useState } from 'react'
import { getRangeWindow, type PriceWindow, zoomWindow } from '~/components/Charts/PriceChart/priceWindow'
import type { TimePeriod } from '~/data/util'
import { CHART_BEHAVIOR } from '~/features/Liquidity/charts/D3LiquidityChartShared/constants'
import { usePdpChartRangeGetter } from '~/pages/PoolDetails/components/LiquidityPanel/PdpChartRangeContext'

/** What the price chart's model takes from the zoom; see `PriceChartModelParams`. */
export type PriceChartZoomParams = {
  priceWindow?: PriceWindow
  visiblePriceWindowRef: { current: (() => PriceWindow | undefined) | null }
  refitKey: number
}

/**
 * The price chart's zoom: the axis window the zoom buttons set, and their handlers. The window belongs to the
 * orientation, pool and period it was set on, so a flip, a new period or another pool goes back to the default
 * fit. Zooming starts from what the chart shows; fit centres the deposit range, or restores the default fit when
 * the range has an open edge.
 */
export function usePriceChartZoom({
  isReversed,
  timePeriod,
  poolId,
}: {
  isReversed: boolean
  timePeriod: TimePeriod
  poolId?: string
}): { chartParams: PriceChartZoomParams; zoomIn: () => void; zoomOut: () => void; fit: () => void } {
  const visiblePriceWindowRef: PriceChartZoomParams['visiblePriceWindowRef'] = useRef(null)
  const getRange = usePdpChartRangeGetter(isReversed)
  const [zoom, setZoom] = useState<{
    window: PriceWindow
    isReversed: boolean
    timePeriod: TimePeriod
    poolId?: string
  }>()
  // Bumped by fit with no window to pin, so the chart re-fits the range as it stands now.
  const [refitKey, setRefitKey] = useState(0)
  const priceWindow =
    zoom && zoom.isReversed === isReversed && zoom.timePeriod === timePeriod && zoom.poolId === poolId
      ? zoom.window
      : undefined
  const setPriceWindow = (window: PriceWindow | undefined) =>
    setZoom(window && { window, isReversed, timePeriod, poolId })
  const zoomBy = (factor: number) => {
    const current = priceWindow ?? visiblePriceWindowRef.current?.()
    if (current) {
      setPriceWindow(zoomWindow(current, factor))
    }
  }
  const chartParams = useMemo(() => ({ priceWindow, visiblePriceWindowRef, refitKey }), [priceWindow, refitKey])

  return {
    chartParams,
    zoomIn: () => zoomBy(CHART_BEHAVIOR.ZOOM_FACTOR),
    zoomOut: () => zoomBy(1 / CHART_BEHAVIOR.ZOOM_FACTOR),
    fit: () => {
      const range = getRange()
      // Undefined for a range with an open edge, which goes back to the default fit.
      const rangeWindow = range && getRangeWindow(range)
      setPriceWindow(rangeWindow)
      if (!rangeWindow) {
        setRefitKey((key) => key + 1)
      }
    },
  }
}
