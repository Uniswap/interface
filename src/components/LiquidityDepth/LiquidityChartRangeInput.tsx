import React, { useEffect, useRef, useState } from 'react'
import { ChartEntry } from './hooks'
import { select, axisBottom, area, curveStep, brushX, zoom } from 'd3'
import usePrevious from 'hooks/usePrevious'
import styled from 'styled-components'
import isEqual from 'lodash.isequal'
import { getScales, xAccessor, yAccessor, brushHandlePath } from './utils'

interface Dimensions {
  width: number
  height: number
}

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}
interface LiquidityChartRangeInputProps {
  // to distringuish between multiple charts in the DOM
  id?: string

  data: {
    series: ChartEntry[]
    current: number
  }

  styles: {
    area: {
      fill: string
      stroke: string
    }

    current: {
      stroke: string
    }

    axis: {
      fill: string
    }

    brush: {
      selection: {
        fill0: string
        fill1: string
      }

      handle: {
        west: string
        east: string
      }
    }

    focus: {
      stroke: string
    }
  }

  dimensions: Dimensions
  margins: Margins

  brushDomain: [number, number] | undefined
  brushLabels: (x: number) => string | undefined
  onBrushDomainChange: (domain: [number, number]) => void
}

const SVG = styled.svg`
  overflow: visible;
`

export function LiquidityChartRangeInput({
  id = 'liquidityChartRangeInput',
  data: { series, current },
  styles,
  dimensions,
  margins,
  brushDomain,
  brushLabels,
  onBrushDomainChange,
}: LiquidityChartRangeInputProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [currentZoomState, setCurrentZoomState] = useState()

  // to avoid update loops
  const previousDomain = usePrevious(brushDomain)

  // controls the brush handles on `brush`
  // allows updating the UI without broadcasting the domain on move
  const [localSelection, setLocalSelection] = useState<[number, number] | undefined>(undefined)

  useEffect(() => {
    if (brushDomain && !isEqual(brushDomain, localSelection)) {
      // keeps the local selection in sync with the brush domain
      setLocalSelection(brushDomain)
    }
  }, [brushDomain, localSelection])

  // will be called initially, and on every data change
  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current || series.length === 0) return

    const svg = select(svgRef.current)
    const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect()

    // @ts-ignore
    function brushed({ type, selection }) {
      // @ts-ignore
      if (!selection || Number.isNaN(selection[0]) || Number.isNaN(selection[1])) {
        svg.select('#brush').selectAll('.brush-handle').attr('display', 'none')
        return
      }

      if (type === 'end') {
        onBrushDomainChange(selection.map(xScale.invert))
      }

      // move brush handle
      svg
        .select('#brush')
        .selectAll('.brush-handle')
        .attr('display', null)
        .attr('transform', (d, i) => {
          // @ts-ignore
          const e = d.type === 'e' ? '1' : '-1'
          return `translate(${[selection[i], 0]}) scale(${e}, 1)`
        })
    }

    // @ts-ignore
    function zoomed({ transform }) {
      setCurrentZoomState(transform)

      // @ts-ignore
      localSelection && setLocalSelection(currentSelection.map(xScale.invert))
    }

    // scales + generators
    const { xScale, yScale } = getScales(series, width, height, margins)

    if (currentZoomState) {
      // @ts-ignore
      const newXscale = currentZoomState.rescaleX(xScale)
      xScale.domain(newXscale.domain())
    }

    const areaGenerator = area()
      .curve(curveStep)
      // @ts-ignore
      .x((d: unknown) => xScale(xAccessor(d)))
      .y0(yScale(0))
      // @ts-ignore
      .y1((d: unknown) => yScale(yAccessor(d)))

    // root svg props
    svg.attr('width', width).attr('height', height)

    // render area
    svg
      .select('#content')
      .selectAll('.area')
      .data([series])
      // @ts-ignore
      .join('path')
      .attr('class', 'area')
      .transition()
      .attr('opacity', '0.5')
      .attr('fill', styles.area.fill)
      .attr('stroke', styles.area.stroke)
      // @ts-ignore
      .attr('d', areaGenerator)

    // render current price
    svg
      .select('#content')
      .selectAll('.line')
      .data([current])
      .join('line')
      .attr('class', 'line')
      .attr('x1', xScale(current))
      .attr('y1', 0)
      .attr('x2', xScale(current))
      .attr('y2', height)
      .transition()
      .style('stroke-width', 3)
      .style('stroke', styles.current.stroke)
      .style('fill', 'none')

    // axes
    const xAxis = axisBottom(xScale).ticks(8, '.4')

    svg
      .select('#x-axis')
      .style('transform', `translateY(${height - margins.bottom}px)`)
      .style('fill', styles.axis.fill)
      .style('opacity', '0.6')
      // @ts-ignore
      .call(xAxis)
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick').select('line').remove())

    // zoom
    const zoomBehavior = zoom()
      .scaleExtent([0.5, 5])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      // @ts-ignore
      //.filter((key) => key.shiftKey)
      .on('zoom', zoomed)

    svg
      // @ts-ignore
      .call(zoomBehavior)
      // disables mouse drag/panning
      .on('mousedown.zoom', null)

    // brush
    const brush = brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      // @ts-ignore
      //.filter((key) => !key.shiftKey)
      .on('start brush end', brushed)

    // initial burhs position + retaining position on resize
    if (brushDomain && previousDomain === brushDomain) {
      svg
        .select('#brush')
        // @ts-ignore
        .call(brush)
        // @ts-ignore
        .call(brush.move, localSelection.map(xScale))
    }

    const brushHandle = svg
      .select('#brush')
      .selectAll('.brush-handle')
      .data([{ type: 'w' }, { type: 'e' }])

    brushHandle
      .enter()
      .append('path')
      .attr('class', 'brush-handle')
      .attr('cursor', 'ew-resize')
      .attr('stroke-width', '2')
      .attr('stroke', (d: { type: string }) => (d.type === 'e' ? styles.brush.handle.east : styles.brush.handle.west))
      .attr('fill', (d: { type: string }) => (d.type === 'e' ? styles.brush.handle.east : styles.brush.handle.west))
      .attr('d', () => brushHandlePath(height))

    brushHandle
      .enter()
      .append('group')
      .attr('class', 'brush-handle-tooltip')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .text('hello')

    // brush linear gradient
    svg.select('#brush').selectAll('.selection').attr('stroke', 'none').attr('fill', `url(#${id}-gradient-selection)`)
  }, [
    brushDomain,
    current,
    currentZoomState,
    dimensions,
    id,
    localSelection,
    margins,
    onBrushDomainChange,
    previousDomain,
    series,
    styles,
  ])

  return (
    <div ref={wrapperRef}>
      <SVG ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>

          <linearGradient id={`${id}-gradient-selection`} x1="0%" y1="100%" x2="100%" y2="100%">
            <stop stopColor={styles.brush.selection.fill0} />
            <stop stopColor={styles.brush.selection.fill1} offset="1" />
          </linearGradient>
        </defs>

        <g id="content" clipPath={`url(#${id})`} />
        <g id="brush" clipPath={`url(#${id})`} />
        <g id="x-axis" />
        <g id="y-axis" />
      </SVG>
    </div>
  )
}
