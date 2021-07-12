import { max, scaleLinear, ZoomTransform } from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Area } from './Area'
import { AxisBottom } from './AxisBottom'
import { Brush } from './Brush'
import { Line } from './Line'
import { ChartEntry, LiquidityChartRangeInputProps } from './types'
import Zoom from './Zoom'

export const xAccessor = (d: ChartEntry) => d.price0
export const yAccessor = (d: ChartEntry) => d.activeLiquidity

export function Chart({
  id = 'liquidityChartRangeInput',
  data: { series, current },
  styles,
  dimensions: { width, height },
  margins,
  interactive = true,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
  zoomLevels,
}: LiquidityChartRangeInputProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [zoom, setZoom] = useState<ZoomTransform>()

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins]
  )

  const { xScale, yScale } = useMemo(() => {
    const scales = {
      xScale: scaleLinear()
        .domain([(1 - zoomLevels.initial) * current, (1 + zoomLevels.initial) * current] as number[])
        .range([0, innerWidth]),
      yScale: scaleLinear()
        .domain([0, max(series, yAccessor)] as number[])
        .range([innerHeight, 0]),
    }

    if (zoom) {
      const newXscale = zoom.rescaleX(scales.xScale)
      scales.xScale.domain(newXscale.domain())
    }

    return scales
  }, [zoomLevels.initial, current, innerWidth, series, innerHeight, zoom])

  useEffect(() => {
    if (!brushDomain) {
      onBrushDomainChange(xScale.domain() as [number, number])
    }
  }, [brushDomain, onBrushDomainChange, xScale])

  // ensures the brush remains in view and adapts to zooms
  xScale.clamp(true)

  return (
    <>
      <Zoom
        svg={svgRef.current}
        xScale={xScale}
        setZoom={setZoom}
        innerWidth={innerWidth}
        innerHeight={innerHeight}
        showClear={Boolean(zoom && zoom.k !== 1)}
        zoomLevels={zoomLevels}
      />
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={`${id}-chart-clip`}>
            <rect x="0" y="0" width={innerWidth} height={height} />
          </clipPath>

          {brushDomain && (
            // mask to highlight selected area
            <mask id={`${id}-chart-area-mask`}>
              <rect
                fill="white"
                x={xScale(brushDomain[0])}
                y="0"
                width={xScale(brushDomain[1]) - xScale(brushDomain[0])}
                height={innerHeight}
              />
            </mask>
          )}
        </defs>

        <g transform={`translate(${margins.left},${margins.top})`}>
          <g clipPath={`url(#${id}-chart-clip)`}>
            <Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} />

            {brushDomain && (
              // duplicate area chart with mask for selected area
              <g mask={`url(#${id}-chart-area-mask)`}>
                <Area
                  series={series}
                  xScale={xScale}
                  yScale={yScale}
                  xValue={xAccessor}
                  yValue={yAccessor}
                  fill={styles.area.selection}
                />
              </g>
            )}

            <Line value={current} xScale={xScale} innerHeight={innerHeight} />

            <AxisBottom xScale={xScale} innerHeight={innerHeight} />
          </g>

          <Brush
            id={id}
            xScale={xScale}
            interactive={interactive}
            brushLabelValue={brushLabels}
            brushExtent={brushDomain ?? (xScale.domain() as [number, number])}
            innerWidth={innerWidth}
            innerHeight={innerHeight}
            setBrushExtent={onBrushDomainChange}
            colors={{
              west: styles.brush.handle.west,
              east: styles.brush.handle.east,
            }}
          />
        </g>
      </svg>
    </>
  )
}
