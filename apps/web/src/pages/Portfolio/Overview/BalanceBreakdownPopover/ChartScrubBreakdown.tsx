import { UTCTimestamp } from 'lightweight-charts'
import { useLayoutEffect, useRef } from 'react'
import { assertWebElement, Flex, TamaguiElement } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { calculateDelta } from '~/components/DeltaArrow/DeltaArrow'
import {
  BalanceBreakdownRow,
  type BalanceBreakdownRowData,
} from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownRow'
import { seriesHasValue } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'

const OVERLAY_WIDTH = 180
const TOP_OFFSET = -spacing.spacing8
// Keep the overlay clear of the y-axis labels on the right.
const RIGHT_EDGE_MARGIN = spacing.spacing8

function pointAtTime(series: PriceChartData[], time: UTCTimestamp): PriceChartData | undefined {
  return series.find((point) => point.time === time)
}

/**
 * Crosshair-following overlay shown while scrubbing the Total chart: splits the balance into
 * tokens / earn / pools (fixed order) at the scrubbed point, each with a semantically-colored %
 * change. Categories with no series point at the scrubbed time or an all-zero series are skipped.
 * The opaque background masks the canvas-drawn crosshair line so it starts below the list.
 */
export function ChartScrubBreakdown({
  coordinates,
  time,
  tokensSeries,
  earnSeries,
  poolsSeries,
}: {
  coordinates: ChartHoverCoordinates
  time: UTCTimestamp
  tokensSeries: PriceChartData[]
  earnSeries: PriceChartData[]
  poolsSeries: PriceChartData[]
}): JSX.Element | null {
  const ref = useRef<TamaguiElement>(null)
  const { x, plotRightEdge } = coordinates

  // Clamp the overlay within the plot, clear of the left edge and y-axis labels.
  // This effect owns `left` (set before paint, omitted from the inline style below) to avoid a re-render per crosshair move.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    assertWebElement(el)
    const parent = el.offsetParent as HTMLElement | null
    const half = el.offsetWidth / 2
    // Right bound is the plot edge (where the y-axis begins), falling back to the container width.
    const rightBound = plotRightEdge ?? parent?.clientWidth ?? x + half
    const maxLeft = rightBound - half - RIGHT_EDGE_MARGIN
    el.style.left = `${Math.min(Math.max(x, half), Math.max(half, maxLeft))}px`
  }, [x, plotRightEdge])

  const rows: BalanceBreakdownRowData[] = (
    [
      { kind: 'tokens', series: tokensSeries },
      { kind: 'earn', series: earnSeries },
      { kind: 'pools', series: poolsSeries },
    ] as const
  ).flatMap(({ kind, series }) => {
    if (!seriesHasValue(series)) {
      return []
    }
    const point = pointAtTime(series, time)
    if (!point) {
      return []
    }
    return [{ kind, valueUSD: point.close, percentChange: calculateDelta(series[0].close, point.close) }]
  })

  if (rows.length < 2) {
    return null
  }

  return (
    <Flex
      ref={ref}
      position="absolute"
      pointerEvents="none"
      width={OVERLAY_WIDTH}
      gap="$spacing4"
      backgroundColor="$surface1"
      pb="$spacing8"
      style={{ top: TOP_OFFSET, transform: 'translateX(-50%)', zIndex: 4 }}
    >
      {rows.map((row) => (
        <BalanceBreakdownRow key={row.kind} {...row} semanticPercentColor />
      ))}
    </Flex>
  )
}
