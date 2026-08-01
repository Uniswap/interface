import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyPanZoom,
  computePanBounds,
  computeViewGroupedBars,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/combinedChartPanZoom'
import { fromQ96ToDecimalWithTokenDecimals } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import type { ProcessedChartData } from '~/features/Toucan/Auction/BidDistributionChart/utils/utils'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'

const MIN_ZOOM_LEVEL = 0.2
const MAX_ZOOM_LEVEL = 5

interface NormalizedDataSlice {
  yMin: number
  yMax: number
  scaleFactor: number
}

/**
 * Manages Y-axis pan and zoom state for the combined auction chart.
 * Handles wheel events, zoom commands from the store, and computes
 * the zoomed/panned view data and grouped bars.
 */
export function useYAxisPanZoom<T extends NormalizedDataSlice>({
  normalizedData,
  chartData,
  clearingPriceDecimal,
  tickSize,
  bidTokenDecimals,
  auctionTokenDecimals,
  chartHeightPx,
  noBidsFloorPrice,
}: {
  normalizedData: T | null | undefined
  chartData: ProcessedChartData | null
  clearingPriceDecimal: number | undefined
  tickSize: string
  bidTokenDecimals: number
  auctionTokenDecimals: number
  chartHeightPx?: number
  /** When set (auction started, zero bids), the default view anchors the floor price near the chart bottom */
  noBidsFloorPrice?: number
}) {
  const { setClearingPriceZoomState, clearChartZoomCommand } = useAuctionStoreActions()
  const chartZoomCommand = useAuctionStore((state) => state.chartZoomCommand)

  const [yPanOffset, setYPanOffset] = useState(0)
  const [yZoomLevel, setYZoomLevel] = useState(1)

  const tickSizeDecimal = useMemo(
    () =>
      fromQ96ToDecimalWithTokenDecimals({
        q96Value: tickSize,
        bidTokenDecimals,
        auctionTokenDecimals,
      }),
    [tickSize, bidTokenDecimals, auctionTokenDecimals],
  )

  const groupedBars = useMemo(() => {
    if (!chartData) {
      return null
    }
    return computeViewGroupedBars({
      chartData,
      yMin: normalizedData?.yMin,
      yMax: normalizedData?.yMax,
      tickSizeDecimal,
      clearingPriceDecimal,
      yZoomLevel,
      chartHeightPx,
    })
  }, [
    chartData,
    tickSizeDecimal,
    clearingPriceDecimal,
    normalizedData?.yMin,
    normalizedData?.yMax,
    yZoomLevel,
    chartHeightPx,
  ])

  // Sync isZoomed to store so the footer reset button enables/disables
  const isZoomed = yPanOffset !== 0 || yZoomLevel !== 1
  useEffect(() => {
    setClearingPriceZoomState({ visibleRange: null, isZoomed })
  }, [isZoomed, setClearingPriceZoomState])

  // Intercept zoom commands from footer buttons — apply to Y-axis, not X-axis.
  useEffect(() => {
    if (!chartZoomCommand || chartZoomCommand.target !== 'clearingPrice') {
      return
    }
    if (chartZoomCommand.action === 'reset') {
      setYPanOffset(0)
      setYZoomLevel(1)
    } else if (chartZoomCommand.action === 'zoomIn') {
      setYZoomLevel((prev) => Math.min(MAX_ZOOM_LEVEL, prev * 1.5))
    } else {
      setYZoomLevel((prev) => Math.max(MIN_ZOOM_LEVEL, prev / 1.5))
    }
    clearChartZoomCommand()
  }, [chartZoomCommand, clearChartZoomCommand])

  const pannedNormalizedData = useMemo(() => {
    if (!normalizedData) {
      return null
    }
    return applyPanZoom({
      normalizedData,
      concentration: chartData?.concentration,
      bars: chartData?.bars,
      yPanOffset,
      yZoomLevel,
      noBidsFloorPrice,
    })
  }, [normalizedData, chartData?.concentration, chartData?.bars, yPanOffset, yZoomLevel, noBidsFloorPrice])

  const panBounds = useMemo(() => {
    if (!chartData || !normalizedData) {
      return null
    }
    return computePanBounds({
      normalizedData,
      bars: groupedBars ?? chartData.bars,
      yZoomLevel,
    })
  }, [chartData, normalizedData, groupedBars, yZoomLevel])

  // Use a ref + native event listener so we can call preventDefault on a non-passive wheel event.
  // Accumulate deltas and flush once per animation frame so multiple wheel events within the
  // same frame are batched into a single React state update.
  const chartWheelRef = useRef<HTMLDivElement>(null)
  const pendingZoomDelta = useRef(0)
  const pendingPanDelta = useRef(0)
  const rafId = useRef<number | null>(null)

  // Keep panBounds in a ref so the wheel effect doesn't re-register on every zoom step.
  const panBoundsRef = useRef(panBounds)
  panBoundsRef.current = panBounds

  useEffect(() => {
    const el = chartWheelRef.current
    if (!el || !normalizedData) {
      return undefined
    }

    const flush = () => {
      rafId.current = null

      if (pendingZoomDelta.current !== 0) {
        // Clamp the accumulated delta so the zoom factor stays positive —
        // without this, rapid scroll accumulation can overflow past -1 and
        // produce a negative multiplier that crashes the zoom level.
        const zoomFactor = Math.max(0.1, 1 + pendingZoomDelta.current)
        pendingZoomDelta.current = 0
        setYZoomLevel((prev) => Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, prev * zoomFactor)))
      }

      if (pendingPanDelta.current !== 0) {
        const delta = pendingPanDelta.current
        pendingPanDelta.current = 0
        setYPanOffset((prev) => {
          const bounds = panBoundsRef.current
          if (!bounds) {
            return prev
          }
          const next = prev - delta
          return Math.max(bounds.min, Math.min(bounds.max, next))
        })
      }
    }

    const handler = (e: WheelEvent) => {
      if (!panBoundsRef.current) {
        return
      }
      e.preventDefault()
      e.stopPropagation()

      if (e.ctrlKey || e.metaKey) {
        pendingZoomDelta.current += -e.deltaY * 0.02
      } else {
        const baseRange = normalizedData.yMax - normalizedData.yMin
        pendingPanDelta.current += e.deltaY * baseRange * 0.003
      }

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flush)
      }
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => {
      el.removeEventListener('wheel', handler)
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [normalizedData])

  /**
   * Pan the Y-axis so that `targetPrice` is centered in the visible range.
   * Mirrors the midpoint logic in `applyPanZoom` so the offset lands correctly.
   */
  const panToPrice = useCallback(
    (targetPrice: number) => {
      if (!normalizedData) {
        return
      }
      // Mirror applyPanZoom's widened-window logic so the offset lands on the same midpoint.
      const view = applyPanZoom({
        normalizedData,
        concentration: chartData?.concentration,
        bars: chartData?.bars,
        yPanOffset: 0,
        yZoomLevel: 1,
        noBidsFloorPrice,
      })
      const baseMidpoint = (view.yMin + view.yMax) / 2
      setYPanOffset(targetPrice - baseMidpoint)
    },
    [normalizedData, chartData?.concentration, chartData?.bars, noBidsFloorPrice],
  )

  return { pannedNormalizedData, groupedBars, tickSizeDecimal, chartWheelRef, panToPrice }
}
