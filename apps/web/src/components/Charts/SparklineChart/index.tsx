import { Flex } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { curveCardinal, scaleLinear } from 'd3'
import { memo } from 'react'
import { getSparklineValueDomain } from 'uniswap/src/components/charts/utils'
import { ChartModelWithLiveDot, LiveDotRenderer } from '~/components/Charts/LiveDotRenderer'
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
  /** Fill under the line with a fade to transparent; see LineChart. */
  showGradientFill?: boolean
  /** Mark the last point with the pulsing live dot the TDP chart uses. */
  showLiveDot?: boolean
  isStablecoin?: boolean
}

// LiveDotRenderer reads the last point from a chart model; the sparkline has none and passes coordinates directly.
const NO_CHART_MODEL: ChartModelWithLiveDot = {}

function SparklineChartInner({
  width,
  height,
  multichainId,
  pricePercentChange,
  sparklineMap,
  color,
  strokeFadeIn = false,
  showGradientFill = false,
  showLiveDot = false,
  isStablecoin = false,
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
  const valueDomain = getSparklineValueDomain({ ...getPriceBounds(pricePoints), isStablecoin })

  // A stroke is centered on its path, so a point at the very edge of a scale's range leaves
  // half the stroke outside the SVG, which has no viewBox and so clips at its own bounds.
  // Both axes put points exactly on their edges — min/max come from the data itself, and the
  // first/last timestamps bound the domain — so inset both ranges by half a stroke.
  const strokeWidth = 1.5
  const padding = strokeWidth / 2
  const widthScale = scaleLinear()
    .domain([startingPrice.timestamp, endingPrice.timestamp])
    .range([padding, width - padding])
  const rdScale = scaleLinear()
    .domain(valueDomain)
    .range([height - padding, padding])
  const curveTension = 0.9

  const lineColor =
    color ?? (pricePercentChange && pricePercentChange < 0 ? colors.statusCritical.val : colors.statusSuccess.val)
  const lineChart = (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => widthScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      yScale={rdScale}
      curve={curveCardinal.tension(curveTension)}
      color={lineColor}
      strokeWidth={strokeWidth}
      strokeFadeIn={strokeFadeIn}
      showGradientFill={showGradientFill}
      width={width}
      height={height}
    />
  )

  if (!showLiveDot) {
    return lineChart
  }

  return (
    <Flex width={width} height={height}>
      {lineChart}
      <LiveDotRenderer
        chartModel={NO_CHART_MODEL}
        isHovering={false}
        overrideColor={lineColor}
        coordinateOverride={{ x: widthScale(endingPrice.timestamp), y: rdScale(endingPrice.value) }}
      />
    </Flex>
  )
}

export const SparklineChart = memo(SparklineChartInner)
