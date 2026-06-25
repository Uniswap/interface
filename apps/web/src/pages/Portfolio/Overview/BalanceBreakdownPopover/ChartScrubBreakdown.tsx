import { UTCTimestamp } from 'lightweight-charts'
import { useLayoutEffect, useRef } from 'react'
import { assertWebElement, Flex, TamaguiElement } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import { PriceChartData } from '~/components/Charts/PriceChart'
import { calculateDelta } from '~/components/DeltaArrow/DeltaArrow'
import { BalanceBreakdownRow } from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/BalanceBreakdownRow'

const OVERLAY_WIDTH = 180
const TOP_OFFSET = -spacing.spacing8
// Keep the overlay clear of the y-axis labels on the right.
const RIGHT_EDGE_MARGIN = spacing.spacing8

function pointAtTime(series: PriceChartData[], time: UTCTimestamp): PriceChartData | undefined {
  return series.find((point) => point.time === time)
}

/**
 * Crosshair-following overlay shown while scrubbing the Total chart: splits the balance into
 * tokens (first) and pools at the scrubbed point, each with a semantically-colored % change.
 */
export function ChartScrubBreakdown({
  coordinates,
  time,
  tokensSeries,
  poolsSeries,
}: {
  coordinates: ChartHoverCoordinates
  time: UTCTimestamp
  tokensSeries: PriceChartData[]
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

  const tokensPoint = pointAtTime(tokensSeries, time)
  const poolsPoint = pointAtTime(poolsSeries, time)

  if (!tokensPoint || !poolsPoint) {
    return null
  }

  return (
    <Flex
      ref={ref}
      position="absolute"
      pointerEvents="none"
      width={OVERLAY_WIDTH}
      gap="$spacing4"
      style={{ top: TOP_OFFSET, transform: 'translateX(-50%)', zIndex: 4 }}
    >
      <BalanceBreakdownRow
        kind="tokens"
        valueUSD={tokensPoint.close}
        percentChange={calculateDelta(tokensSeries[0].close, tokensPoint.close)}
        semanticPercentColor
      />
      <BalanceBreakdownRow
        kind="pools"
        valueUSD={poolsPoint.close}
        percentChange={calculateDelta(poolsSeries[0].close, poolsPoint.close)}
        semanticPercentColor
      />
    </Flex>
  )
}
