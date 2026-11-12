import { ReactElement, useMemo } from 'react'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { Chart, ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import { CandlestickTooltip } from '~/components/Charts/PriceChart/CandlestickTooltip'
import { PriceChartModel } from '~/components/Charts/PriceChart/PriceChartModel'
import { PriceChartData, PriceChartType } from '~/utils/charts'

export interface PriceChartBodyProps {
  type: PriceChartType
  height: number | string
  data: PriceChartData[]
  stale: boolean
  timePeriod?: HistoryDuration
  overrideColor?: string
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  yAxisTickmarksFormatter?: (prices: number[]) => string[]
  disableLowPriceRangeScaling?: boolean
  sparkline?: boolean
  hideMinMaxLines?: boolean
  isStablecoin?: boolean
  onCrosshairChange?: (crosshairData?: PriceChartData) => void
  /** Optional overlay render prop with access to the chart's crosshair data, hover pixel coordinates, and plot right edge. */
  children?: (crosshairData?: PriceChartData, hover?: ChartHoverCoordinates | null) => ReactElement | null
}

export function PriceChartBody({
  data,
  height,
  type,
  stale,
  timePeriod,
  overrideColor,
  hideYAxis,
  hideXAxis,
  yAxisFormatter,
  yAxisTickmarksFormatter,
  disableLowPriceRangeScaling,
  sparkline,
  hideMinMaxLines,
  isStablecoin,
  onCrosshairChange,
  children,
}: PriceChartBodyProps) {
  const v2HoverStyles = !sparkline && type === PriceChartType.LINE

  return (
    <Chart
      Model={PriceChartModel}
      params={useMemo(
        () => ({
          data,
          type,
          stale,
          timePeriod,
          hideYAxis,
          hideXAxis,
          yAxisFormatter,
          yAxisTickmarksFormatter,
          disableLowPriceRangeScaling,
          sparkline,
          hideMinMaxLines,
          v2HoverStyles,
          isStablecoin,
        }),
        [
          data,
          stale,
          type,
          timePeriod,
          hideYAxis,
          hideXAxis,
          yAxisFormatter,
          yAxisTickmarksFormatter,
          disableLowPriceRangeScaling,
          sparkline,
          hideMinMaxLines,
          v2HoverStyles,
          isStablecoin,
        ],
      )}
      height={height}
      overrideColor={overrideColor}
      TooltipBody={type === PriceChartType.CANDLESTICK ? CandlestickTooltip : undefined}
      onCrosshairChange={onCrosshairChange}
      showDottedBackground={true}
      showLeftFadeOverlay={type === PriceChartType.LINE}
      v2HoverStyles={v2HoverStyles}
      disableScrubbing={sparkline}
    >
      {children}
    </Chart>
  )
}
