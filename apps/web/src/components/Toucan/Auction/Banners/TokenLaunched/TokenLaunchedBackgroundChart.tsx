import { LinePath } from '@visx/shape'
import { curveCardinal, scaleLinear } from 'd3'
import { memo, useId, useMemo } from 'react'

const CHART_WIDTH = 240
const VERTICAL_PADDING = 6

interface DataPoint {
  timestamp: number
  value: number
}

interface TokenLaunchedBackgroundChartProps {
  series: DataPoint[]
  strokeColor: string
  height: number
}

function _TokenLaunchedBackgroundChart({ series, strokeColor, height }: TokenLaunchedBackgroundChartProps) {
  const { xScale, yScale } = useMemo(() => {
    const timestamps = series.map((point) => point.timestamp)
    const values = series.map((point) => point.value)

    const minTimestamp = Math.min(...timestamps)
    const maxTimestamp = Math.max(...timestamps)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    const resolvedMinValue = minValue === maxValue ? minValue - 1 : minValue
    const resolvedMaxValue = minValue === maxValue ? maxValue + 1 : maxValue

    return {
      xScale: scaleLinear().domain([minTimestamp, maxTimestamp]).range([0, CHART_WIDTH]),
      yScale: scaleLinear()
        .domain([resolvedMinValue, resolvedMaxValue])
        .range([height - VERTICAL_PADDING, VERTICAL_PADDING]),
    }
  }, [series, height])

  const instanceId = useId()
  const gradientId = `chart-fade-gradient-${instanceId}`

  return (
    <svg width={CHART_WIDTH} height={height} viewBox={`0 0 ${CHART_WIDTH} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={1} />
        </linearGradient>
      </defs>
      <LinePath
        data={series}
        x={(d) => xScale(d.timestamp)}
        y={(d) => yScale(d.value)}
        curve={curveCardinal.tension(0.7)}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const TokenLaunchedBackgroundChart = memo(_TokenLaunchedBackgroundChart)
