import { curveCardinal, scaleLinear } from 'd3'
import { memo } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { getPriceBounds } from '~/components/Charts/PriceChart/utils'
import { LineChart } from '~/components/Charts/SparklineChart/LineChart'
import { LoadingBubble } from '~/components/Tokens/loading'
import { SparklineMap } from '~/data/types'
import { PricePoint } from '~/data/util'

interface SparklineChartProps {
  width: number
  height: number
  multichainId: string | undefined
  pricePercentChange?: number | null
  sparklineMap: SparklineMap
  /** Overrides the price-direction color (e.g. an extracted token accent). */
  color?: string
  /** Fade the stroke in left-to-right; see LineChart. */
  strokeFadeIn?: boolean
}

function SparklineChartInner({
  width,
  height,
  multichainId,
  pricePercentChange,
  sparklineMap,
  color,
  strokeFadeIn = false,
}: SparklineChartProps) {
  const colors = useSporeColors()
  const pricePoints = multichainId ? sparklineMap[multichainId] : null

  // Don't display if there's one or less pricepoints
  if (!pricePoints || pricePoints.length <= 1) {
    return (
      <Flex height="100%" centered>
        <LoadingBubble height="4px" width="90%" />
      </Flex>
    )
  }

  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const widthScale = scaleLinear()
    .domain(
      // the range of possible input values
      [startingPrice.timestamp, endingPrice.timestamp],
    )
    .range(
      // the range of possible output values that the inputs should be transformed to (see https://www.d3indepth.com/scales/ for details)
      [0, 110],
    )

  const { min, max } = getPriceBounds(pricePoints)
  const rdScale = scaleLinear().domain([min, max]).range([height, 0])
  const curveTension = 0.9

  return (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => widthScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      curve={curveCardinal.tension(curveTension)}
      color={
        color ?? (pricePercentChange && pricePercentChange < 0 ? colors.statusCritical.val : colors.statusSuccess.val)
      }
      strokeWidth={1.5}
      strokeFadeIn={strokeFadeIn}
      width={width}
      height={height}
    />
  )
}

export const SparklineChart = memo(SparklineChartInner)
