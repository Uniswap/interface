import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ReactElement, useMemo } from 'react'
import { Chart, ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import { CandlestickTooltip } from '~/components/Charts/PriceChart/CandlestickTooltip'
import { PriceChartData, PriceChartModel } from '~/components/Charts/PriceChart/PriceChartModel'
import { PriceChartType } from '~/components/Charts/utils'

export interface PriceChartBodyProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
  timePeriod?: GraphQLApi.HistoryDuration
  overrideColor?: string
  hideYAxis?: boolean
  hideXAxis?: boolean
  yAxisFormatter?: (price: number) => string
  sparkline?: boolean
  hideMinMaxLines?: boolean
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
  sparkline,
  hideMinMaxLines,
  onCrosshairChange,
  children,
}: PriceChartBodyProps) {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  const v2HoverStyles = !sparkline && type === PriceChartType.LINE && isDataLivelinessEnabled

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
          sparkline,
          hideMinMaxLines,
          v2HoverStyles,
        }),
        [
          data,
          stale,
          type,
          timePeriod,
          hideYAxis,
          hideXAxis,
          yAxisFormatter,
          sparkline,
          hideMinMaxLines,
          v2HoverStyles,
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
