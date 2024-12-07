import { AxisLeft } from 'components/Charts/ActiveLiquidityChart/AxisLeft'
import { Brush2 } from 'components/Charts/ActiveLiquidityChart/Brush2'
import { HorizontalArea } from 'components/Charts/ActiveLiquidityChart/HorizontalArea'
import { HorizontalLine } from 'components/Charts/ActiveLiquidityChart/HorizontalLine'
import { ChartEntry } from 'components/LiquidityChartRangeInput/types'
import { max as getMax, scaleLinear } from 'd3'
import { useEffect, useMemo } from 'react'
import { useSporeColors } from 'ui/src'

const xAccessor = (d: ChartEntry) => d.activeLiquidity
const yAccessor = (d: ChartEntry) => d.price0

/**
 * A horizontal version of the active liquidity area chart, which uses the standard
 * x-y coordinate plane to show the data. However, note that the default use case (the range input)
 * shows the data on the right, so by default the chart is flipped along both axes!
 *
 * Post-flip:
 *   - Bars grow (to the left) along the X axis to represent the active liquidity at a given price.
 *   - Bars are placed along the Y axis to represent price (i.e. bottom of chart is y=0 or the min price).
 */
export function ActiveLiquidityChart2({
  id = 'ActiveLiquidityChart2',
  data: { series, current, min, max },
  dimensions: { width, height, contentWidth, axisLabelPaneWidth },
  brushDomain,
  onBrushDomainChange,
  disableBrushInteraction,
}: {
  id?: string
  data: {
    series: ChartEntry[]
    current: number
    min?: number
    max?: number
  }
  disableBrushInteraction?: boolean
  dimensions: { width: number; height: number; contentWidth: number; axisLabelPaneWidth: number }
  brushDomain?: [number, number]
  onBrushDomainChange: (domain: [number, number], mode: string | undefined) => void
}) {
  const colors = useSporeColors()

  const { xScale, yScale } = useMemo(() => {
    const activeEntries = min && max ? series.filter((d) => d.price0 >= min && d.price0 <= max) : series

    // These linear scales map the data to non-flipped x-y coordinates!
    // The flipping of the chart happens only with CSS below.
    const scales = {
      yScale: scaleLinear()
        .domain([min, max] as number[])
        .range([0, height]),
      xScale: scaleLinear()
        .domain([0, getMax(activeEntries, xAccessor)] as number[])
        .range([axisLabelPaneWidth, axisLabelPaneWidth + contentWidth]),
    }

    return scales
  }, [min, max, series, height, axisLabelPaneWidth, contentWidth])

  useEffect(() => {
    if (!brushDomain) {
      const [min, max] = yScale.domain()
      const lowerBound = min + (max - min) * 0.2
      const upperBound = min + (max - min) * 0.8
      onBrushDomainChange([lowerBound, upperBound], undefined)
    }
  }, [brushDomain, onBrushDomainChange, yScale])

  return (
    <>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        // This line flips the chart along both axes.
        style={{ overflow: 'visible', transform: 'scale(-1, -1)' }}
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
                y={yScale(brushDomain[0])}
                x={axisLabelPaneWidth - 1}
                height={yScale(brushDomain[1]) - yScale(brushDomain[0])}
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
              fill={colors.neutral1.val}
              selectedFill={colors.accent1.val}
              containerHeight={height}
            />

            <HorizontalLine value={current} yScale={yScale} xScale={xScale} width={contentWidth + 12} />

            <AxisLeft
              yScale={yScale}
              offset={12}
              min={brushDomain?.[0]}
              current={current}
              max={brushDomain?.[1]}
              height={height}
            />
          </g>

          <Brush2
            id={id}
            yScale={yScale}
            interactive={!disableBrushInteraction}
            brushExtent={brushDomain ?? (yScale.domain() as [number, number])}
            hideHandles={!brushDomain}
            width={width}
            height={height}
            offset={axisLabelPaneWidth}
            setBrushExtent={onBrushDomainChange}
          />
        </g>
      </svg>
    </>
  )
}
