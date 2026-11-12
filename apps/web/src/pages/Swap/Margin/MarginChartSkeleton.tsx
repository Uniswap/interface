import { Flex, Shine } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { ChartSkeleton, ChartSkeletonAxes } from '~/components/Charts/LoadingState'
import { MARGIN_TIME_WINDOWS, type MarginTimeWindow } from '~/pages/Swap/Margin/chart/marginTimeWindows'
import { useHeightBeforePaint } from '~/pages/Swap/Margin/hooks/useHeightBeforePaint'
import { MARGIN_TIME_AXIS_HEIGHT, marginVolumePaneHeight } from '~/pages/Swap/Margin/marginChartLayout'
import { ChartType } from '~/utils/charts'

// Bar heights as a % of the volume pane; the real pane's 25% top margin caps bars at 75%.
const MIN_BAR_HEIGHT_PCT = 9
const MAX_BAR_HEIGHT_PCT = 60
// Skews toward short bars with the odd spike, like real volume. Higher is spikier.
const BAR_SPIKINESS = 4
// More than any time window draws (1Y's ~183 candles).
const MAX_BAR_COUNT = 200

/** Stable 0–1 noise per index (the classic shader hash), so the bars never reshuffle. */
function noise(index: number): number {
  return Math.abs(Math.sin(index * 12.9898) * 43758.5453) % 1
}

const BAR_HEIGHTS = Array.from(
  { length: MAX_BAR_COUNT },
  (_, i) => MIN_BAR_HEIGHT_PCT + (MAX_BAR_HEIGHT_PCT - MIN_BAR_HEIGHT_PCT) * noise(i) ** BAR_SPIKINESS,
)
const SWEEP_MS = 2000
const SWEEP_CSS = `@keyframes margin-volume-key { 0%, 7.7%, 100% { opacity: 0.45 } 2.7% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .margin-volume-key { animation: none !important } }`

/**
 * Chart loading state at the real chart's split: price pane, volume pane, time axis. The volume pane draws a
 * bar per candle `timeWindow` will draw, at the real histogram's spacing (1px gaps, clear of the ~80px price
 * scale), with a highlight sweeping across them like a run of piano keys.
 */
export function MarginChartSkeleton({ timeWindow, testID }: { timeWindow: MarginTimeWindow; testID?: string }) {
  const colors = useSporeColors()
  const { ref, height } = useHeightBeforePaint()

  const volumeHeight = marginVolumePaneHeight(height)
  const priceHeight = Math.max(0, height - volumeHeight - MARGIN_TIME_AXIS_HEIGHT)
  const { windowSeconds, candleSeconds } = MARGIN_TIME_WINDOWS[timeWindow]
  const barCount = Math.round(windowSeconds / candleSeconds)

  return (
    <Flex ref={ref} fill minHeight={0} testID={testID}>
      {height > 0 && (
        <>
          <style>{SWEEP_CSS}</style>
          <ChartSkeleton type={ChartType.PRICE} height={priceHeight} hidePriceIndicators hideXAxis />
          <Flex row alignItems="flex-end" height={volumeHeight} gap={1} pr={80}>
            {BAR_HEIGHTS.slice(0, barCount).map((barHeight, i) => (
              <Flex
                key={i}
                flex={1}
                height={`${barHeight}%`}
                backgroundColor="$neutral3"
                className="margin-volume-key"
                style={{
                  opacity: 0.45,
                  animation: `margin-volume-key ${SWEEP_MS * 1.3}ms ease-in-out ${(i * SWEEP_MS) / barCount}ms infinite`,
                }}
              />
            ))}
          </Flex>
          <Shine>
            <ChartSkeletonAxes
              height={MARGIN_TIME_AXIS_HEIGHT}
              fillColor={colors.neutral3.val}
              tickColor={colors.neutral3.val}
              hideYAxis
              hidePriceIndicators
            />
          </Shine>
        </>
      )}
    </Flex>
  )
}
