import { CrosshairMode, createChart, type IChartApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { useSporeColors } from 'ui/src'
import { formatShortDateTime } from '~/features/Toucan/Auction/utils/formatting'

export const AUCTION_CHART_HEIGHT = 200

/**
 * Creates and manages a lightweight-charts instance with shared auction chart styling.
 *
 * Returns a container ref to attach to a div and the chart instance (null until ready).
 * The chart is created when `enabled` is true and the container is mounted.
 * Color-dependent styling is kept in sync with the theme automatically.
 *
 * Consumers should use their own `useEffect` keyed on `chart` + their data
 * to add series, subscribe to events, etc.
 */
export function useAuctionChart({ enabled = true }: { enabled?: boolean } = {}) {
  const colors = useSporeColors()
  const containerRef = useRef<HTMLDivElement>(null)
  const [chart, setChart] = useState<IChartApi | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) {
      return undefined
    }

    const newChart = createChart(container, {
      width: container.clientWidth,
      height: AUCTION_CHART_HEIGHT,
      layout: {
        background: { color: 'transparent' },
        textColor: colors.neutral2.val,
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: colors.surface3.val, style: 1 },
      },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: UTCTimestamp) => formatShortDateTime(new Date(time * 1000)),
      },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        mode: CrosshairMode.Magnet,
        horzLine: { visible: false, labelVisible: false },
        vertLine: {
          visible: true,
          labelVisible: false,
          color: colors.neutral2.val,
          style: 3,
        },
      },
    })

    setChart(newChart)

    const resizeObserver = new ResizeObserver(() => {
      newChart.applyOptions({ width: container.clientWidth })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      newChart.remove()
      setChart(null)
    }
    /* oxlint-disable-next-line react-hooks/exhaustive-deps -- colors excluded: initial values used at creation, second effect handles theme updates via applyOptions */
  }, [enabled])

  useEffect(() => {
    if (!chart) {
      return
    }
    chart.applyOptions({
      layout: { textColor: colors.neutral2.val },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: colors.surface3.val, style: 1 },
      },
      crosshair: {
        vertLine: { color: colors.neutral2.val },
      },
    })
  }, [chart, colors])

  return { containerRef, chart }
}
