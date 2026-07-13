import { curveCardinal, scaleLinear } from 'd3'
import { Flex, useSporeColors } from 'ui/src'
import type { AssetSparklineChartPoint } from 'uniswap/src/data/rest/rwa/sparklineUtils'
import { LineChart } from '~/components/Charts/SparklineChart/LineChart'

interface AssetSparklineProps {
  data: AssetSparklineChartPoint[]
  width?: number
  height?: number
  isNegative?: boolean
}

/** Lightweight price sparkline for asset cards and table rows. */
export function AssetSparkline({
  data,
  width = 96,
  height = 36,
  isNegative = false,
}: AssetSparklineProps): JSX.Element {
  const colors = useSporeColors()

  if (data.length <= 1) {
    return <Flex width={width} height={height} />
  }

  const timestamps = data.map((point) => point.timestamp)
  const values = data.map((point) => point.value)
  const xScale = scaleLinear()
    .domain([Math.min(...timestamps), Math.max(...timestamps)])
    .range([0, width])
  const yScale = scaleLinear()
    .domain([Math.min(...values), Math.max(...values)])
    .range([height - 2, 2])

  return (
    <LineChart
      data={data}
      getX={(point) => xScale(point.timestamp)}
      getY={(point) => yScale(point.value)}
      curve={curveCardinal.tension(0.9)}
      color={isNegative ? colors.statusCritical.val : colors.statusSuccess.val}
      strokeWidth={1.5}
      showGradientFill
      yScale={yScale}
      width={width}
      height={height}
    />
  )
}
