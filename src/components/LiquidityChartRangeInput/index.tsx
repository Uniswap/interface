import React, { useEffect, useMemo, useRef, useState } from 'react'
import { select, brushX, zoom, scaleLinear, max, min } from 'd3'
import usePrevious from 'hooks/usePrevious'
import { brushHandlePath, getTextWidth, brushHandleAccentPath } from '../LiquidityDepth/utils'
import isEqual from 'lodash.isequal'
import { AxisBottom } from './AxisBottom'
import { Line } from './Line'
import { Area } from './Area'
import { Brush } from './Brush'
import { LiquidityChartRangeInputProps } from './types'
import { ChartEntry } from 'components/LiquidityDepth/hooks'

/*
 * TODO
 * - move graph inside margins and clip path at 100%
 */

export const xAccessor = (d: ChartEntry) => d.price0
export const yAccessor = (d: ChartEntry) => d.activeLiquidity

export const getScales = (series: ChartEntry[], width: number, height: number) => {
  return {
    xScale: scaleLinear()
      .domain([min(series, xAccessor), max(series, xAccessor)] as number[])
      .range([0, width]),
    yScale: scaleLinear()
      .domain([0, max(series, yAccessor)] as number[])
      .range([height, 0]),
  }
}

export function LiquidityChartRangeInput({
  id = 'liquidityChartRangeInput',
  data: { series, current },
  styles,
  dimensions: { width, height },
  margins,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
}: LiquidityChartRangeInputProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [currentZoomState, setCurrentZoomState] = useState()

  const [innerHeight, innerWidth] = useMemo(
    () => [height - margins.top - margins.bottom, width - margins.left - margins.right],
    [width, height, margins]
  )

  // scales + generators
  const { xScale, yScale } = useMemo(
    () => getScales(series, innerWidth, innerHeight),
    [series, innerWidth, innerHeight]
  )

  // will be called initially, and on every data change
  useEffect(() => {
    if (!svgRef.current || series.length === 0) return

    const svg = select(svgRef.current)

    // @ts-ignore
    function zoomed({ transform }) {
      setCurrentZoomState(transform)
    }

    if (currentZoomState) {
      // @ts-ignore
      const newXscale = currentZoomState.rescaleX(xScale)
      xScale.domain(newXscale.domain())
    }

    // zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      // @ts-ignore
      //.filter((key) => key.shiftKey)
      .on('zoom', zoomed)

    svg
      // @ts-ignore
      .call(zoomBehavior)
      // disables mouse drag/panning
      .on('mousedown.zoom', null)
  }, [
    brushDomain,
    brushLabels,
    current,
    currentZoomState,
    id,
    margins,
    onBrushDomainChange,
    series,
    styles,
    innerHeight,
    innerWidth,
    xScale,
    yScale,
  ])

  return (
    <svg ref={svgRef} style={{ overflow: 'visible' }} width={width} height={height}>
      <defs>
        <clipPath id={`${id}-chart-clip`}>
          <rect x="0" y="0" width="100%" height="100%" />
        </clipPath>

        <clipPath id={`${id}-brush-clip`}>
          <rect x="0" y="0" width="100%" height="100%" />
        </clipPath>
      </defs>

      <g transform={`translate(${margins.left},${margins.top})`}>
        <Area series={series} xScale={xScale} yScale={yScale} xValue={xAccessor} yValue={yAccessor} />

        <Line value={current} xScale={xScale} innerHeight={innerHeight} />

        <AxisBottom xScale={xScale} innerHeight={innerHeight} />

        <Brush
          xScale={xScale}
          brushExtent={brushDomain ?? (xScale.range() as [number, number])}
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
  )
}
