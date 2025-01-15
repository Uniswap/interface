import { Currency, Percent } from '@uniswap/sdk-core'
import { AxisRight } from 'components/Charts/ActiveLiquidityChart/AxisRight'
import { Brush2 } from 'components/Charts/ActiveLiquidityChart/Brush2'
import { HorizontalArea } from 'components/Charts/ActiveLiquidityChart/HorizontalArea'
import { HorizontalLine } from 'components/Charts/ActiveLiquidityChart/HorizontalLine'
import { TickTooltip } from 'components/Charts/ActiveLiquidityChart/TickTooltip'
import { ChartEntry } from 'components/LiquidityChartRangeInput/types'
import { max as getMax, scaleLinear } from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { useFormatter } from 'utils/formatNumbers'

const xAccessor = (d: ChartEntry) => d.activeLiquidity
const yAccessor = (d: ChartEntry) => d.price0

const priceDataCache = new Map<string, ChartEntry>()

function findClosestElementBinarySearch(data: ChartEntry[], target?: number) {
  let left = 0
  let right = data.length - 1

  if (!target) {
    return null
  }

  if (priceDataCache.has(target.toString())) {
    return priceDataCache.get(target.toString())
  }

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (data[mid].price0 === target) {
      priceDataCache.set(target.toString(), data[mid])
      return data[mid]
    } else if (data[mid].price0 < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // After binary search, left and right are the closest bounds
  const closest = data[right] ?? { price0: Infinity } // Handle bounds
  const nextClosest = data[left] ?? { price0: Infinity }

  // Return the element with the closest `price0`
  const closestElement =
    Math.abs(closest.price0 - target) <= Math.abs(nextClosest.price0 - target) ? closest : nextClosest

  if (closestElement) {
    priceDataCache.set(target.toString(), closestElement)
  }
  return closestElement
}

function scaleToInteger(a: number, precision = 18) {
  const scaleFactor = Math.pow(10, precision)
  return Math.round(a * scaleFactor)
}

/**
 * A horizontal version of the active liquidity area chart, which uses the
 * x-y coordinate plane to show the data, but with the axes flipped so lower
 * prices are at the bottom of the chart, and liquidity bars grow from the right end of the chart.
 *   - Bars grow (to the left) along the X axis to represent the active liquidity at a given price.
 *   - Bars are placed along the Y axis to represent price (i.e. bottom of chart is y=0 or the min price).
 */
export function ActiveLiquidityChart2({
  id = 'ActiveLiquidityChart2',
  currency0,
  currency1,
  data: { series, current, min, max },
  dimensions: { width, height, contentWidth, axisLabelPaneWidth },
  brushDomain,
  onBrushDomainChange,
  disableBrushInteraction,
  showDiffIndicators,
  isMobile,
}: {
  id?: string
  currency0: Currency
  currency1: Currency
  data: {
    series: ChartEntry[]
    current: number
    min?: number
    max?: number
  }
  disableBrushInteraction?: boolean
  showDiffIndicators?: boolean
  dimensions: { width: number; height: number; contentWidth: number; axisLabelPaneWidth: number }
  brushDomain?: [number, number]
  onBrushDomainChange: (domain: [number, number], mode: string | undefined) => void
  isMobile?: boolean
}) {
  const { formatPercent } = useFormatter()
  const colors = useSporeColors()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoverY, setHoverY] = useState<number>()

  const { xScale, yScale } = useMemo(() => {
    const activeEntries = min && max ? series.filter((d) => d.price0 >= min && d.price0 <= max) : series

    const scales = {
      yScale: scaleLinear()
        .domain([min, max] as number[])
        .range([height, 0]),
      xScale: scaleLinear()
        .domain([0, getMax(activeEntries, xAccessor)] as number[])
        .range([width - axisLabelPaneWidth, width - axisLabelPaneWidth - contentWidth]),
    }

    return scales
  }, [min, max, series, height, width, axisLabelPaneWidth, contentWidth])

  const hoveredTick = useMemo(() => {
    if (!hoverY || !yScale) {
      return undefined
    }
    const price = yScale.invert(hoverY)
    return findClosestElementBinarySearch(series, price)
  }, [hoverY, series, yScale])

  const currentTick = useMemo(() => {
    return findClosestElementBinarySearch(series, current)?.tick
  }, [current, series])

  useEffect(() => {
    if (!brushDomain) {
      const [min, max] = yScale.domain()
      const lowerBound = min + (max - min) * 0.2
      const upperBound = min + (max - min) * 0.8
      onBrushDomainChange([lowerBound, upperBound], undefined)
    }
  }, [brushDomain, onBrushDomainChange, yScale])

  const southHandleInView = brushDomain && yScale(brushDomain[0]) >= 0 && yScale(brushDomain[0]) <= height
  const northHandleInView = brushDomain && yScale(brushDomain[1]) >= 0 && yScale(brushDomain[1]) <= height

  return (
    <>
      {hoverY && hoveredTick && (
        <TickTooltip
          hoverY={hoverY}
          hoveredTick={hoveredTick ?? undefined}
          currentTick={currentTick}
          currentPrice={current}
          contentWidth={contentWidth}
          axisLabelPaneWidth={axisLabelPaneWidth}
          currency0={currency0}
          currency1={currency1}
        />
      )}
      {showDiffIndicators && (
        <>
          {southHandleInView && (
            <Flex
              borderRadius="$rounded12"
              backgroundColor="$surface2"
              borderColor="$surface3"
              borderWidth={1}
              p="$padding8"
              position="absolute"
              left={0}
              top={yScale(brushDomain[0]) - 16}
            >
              <Text variant="body4">
                {formatPercent(new Percent(scaleToInteger(brushDomain[0] - current), scaleToInteger(current)))}
              </Text>
            </Flex>
          )}
          {northHandleInView && (
            <Flex
              borderRadius="$rounded12"
              backgroundColor="$surface2"
              borderColor="$surface3"
              borderWidth={1}
              p="$padding8"
              position="absolute"
              left={0}
              top={yScale(brushDomain[1]) - 16}
            >
              <Text variant="body4">
                {formatPercent(new Percent(scaleToInteger(brushDomain[1] - current), scaleToInteger(current)))}
              </Text>
            </Flex>
          )}
        </>
      )}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={(event) => {
          if (!svgRef.current) {
            return
          }
          const rect = svgRef.current?.getBoundingClientRect()
          const y = event.clientY - rect.top
          const x = event.clientX - rect.left
          if (x > width - axisLabelPaneWidth - contentWidth) {
            setHoverY(y)
          } else {
            setHoverY(undefined)
          }
        }}
        onMouseLeave={() => setHoverY(undefined)}
      >
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="white"
                y={yScale(brushDomain[1])}
                x={width - axisLabelPaneWidth - contentWidth - 1}
                height={yScale(brushDomain[0]) - yScale(brushDomain[1])}
                width={contentWidth + 2}
              />
            </mask>
          )}
        </defs>

        <g>
          <g clipPath={`url(#${id}-chart-clip)`}>
            <HorizontalArea
              series={series}
              xScale={xScale}
              yScale={yScale}
              xValue={xAccessor}
              yValue={yAccessor}
              brushDomain={brushDomain}
              fill={opacify(isMobile ? 10 : 100, brushDomain ? colors.neutral1.val : colors.accent1.val)}
              selectedFill={opacify(isMobile ? 10 : 100, colors.accent1.val)}
              containerHeight={height}
              containerWidth={width - axisLabelPaneWidth}
            />

            <HorizontalLine
              value={current}
              yScale={yScale}
              width={contentWidth + 12}
              containerWidth={width - axisLabelPaneWidth}
            />

            {hoverY && (
              <HorizontalLine
                value={yScale.invert(hoverY)}
                yScale={yScale}
                width={contentWidth + 12}
                containerWidth={width - axisLabelPaneWidth}
                lineStyle="solid"
              />
            )}

            {isMobile ? null : (
              <AxisRight
                yScale={yScale}
                offset={width - contentWidth}
                min={brushDomain?.[0]}
                current={current}
                max={brushDomain?.[1]}
                height={height}
              />
            )}
          </g>

          <Brush2
            id={id}
            yScale={yScale}
            interactive={!disableBrushInteraction}
            brushExtent={brushDomain ?? (yScale.domain() as [number, number])}
            hideHandles={!brushDomain}
            width={width - axisLabelPaneWidth}
            height={height}
            setBrushExtent={onBrushDomainChange}
          />
        </g>
      </svg>
    </>
  )
}
