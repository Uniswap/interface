import React, { useEffect, useRef, useState } from 'react'
import { ChartEntry } from './hooks'
import { select, scaleLinear, max, axisBottom, area, curveStep, brushX, min, zoom, format, arc } from 'd3'
import usePrevious from 'hooks/usePrevious'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'

interface Dimensions {
  width: number
  height: number
  boundedWidth: number
  boundedHeight: number
}

interface BrushableAreaChartProps {
  id?: string

  data: {
    series: ChartEntry[]
    current: number
  }

  dimensions: Dimensions

  brushDomain: [number, number] | undefined
  onBrushDomainChange: (domain: [number, number]) => void
}

const SVG = styled.svg`
  overflow: visible;
`

const xAccessor = (d: ChartEntry) => d.price0
const yAccessor = (d: ChartEntry) => d.activeLiquidity

const getScales = (series: ChartEntry[], width: number, height: number) => {
  return {
    xScale: scaleLinear()
      .domain([min(series, xAccessor), max(series, xAccessor)] as number[])
      .range([0, width]),
    yScale: scaleLinear()
      .domain([0, max(series, yAccessor)] as number[])
      .range([height, 0]),
  }
}

export function BrushableAreaChart({
  id = 'myBrushableAreaChart',
  data: { series, current },
  dimensions,
  brushDomain = [0, 10],
  onBrushDomainChange,
}: BrushableAreaChartProps) {
  const theme = useTheme()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [currentZoomState, setCurrentZoomState] = useState()

  const [currentSelection, setCurrentSelection] = useState(brushDomain)
  const previousSelection = usePrevious(brushDomain)

  useEffect(() => {
    if (brushDomain[0] !== currentSelection[0] && brushDomain[1] !== currentSelection[1]) {
      setCurrentSelection(brushDomain)
    }
  }, [brushDomain, currentSelection])

  // will be called initially, and on every data change
  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current || series.length === 0) return

    const svg = select(svgRef.current)
    const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect()

    // @ts-ignore
    function brushed({ type, selection }) {
      // @ts-ignore
      if (!selection || Number.isNaN(selection[0]) || Number.isNaN(selection[1])) {
        svg.select('#brush').selectAll('.v-brush-handle').attr('display', 'none')
        return
      }

      if (type === 'end') {
        onBrushDomainChange(selection.map(xScale.invert))
      }

      // move brush handle
      svg
        .select('#brush')
        .selectAll('.v-brush-handle')
        .attr('display', null)
        .attr('transform', (d, i) => `translate(${[selection[i], -height / 4]})`)
    }

    // @ts-ignore
    function zoomed({ transform }) {
      setCurrentZoomState(transform)

      // @ts-ignore
      setCurrentSelection(currentSelection.map(xScale.invert))
    }

    // scales + generators
    const { xScale, yScale } = getScales(series, width, height)

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
      .join('path')
      .attr('class', 'area')
      .transition()
      .attr('opacity', '0.5')
      .attr('fill', theme.blue1)
      .attr('stroke', 'none')
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
      .style('stroke', theme.text1)
      .style('fill', 'none')

    // axes
    const xAxis = axisBottom(xScale).ticks(8, '.4')

    svg
      .select('#x-axis')
      .style('transform', `translateY(${height}px)`)
      .style('fill', theme.text1)
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
      .filter((key) => key.shiftKey)
      .on('zoom', zoomed)

    // @ts-ignore
    svg.call(zoomBehavior)

    // brush
    const brush = brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      // @ts-ignore
      .filter((key) => !key.shiftKey)
      .on('start brush end', brushed)

    // initial position + retaining position on resize
    if (previousSelection === currentSelection) {
      svg
        .select('#brush')
        // @ts-ignore
        .call(brush)
        // @ts-ignore
        .call(brush.move, currentSelection.map(xScale))
    }

    svg
      .select('#brush')
      .selectAll('.v-brush-handle')
      .data([{ type: 'w' }, { type: 'e' }])
      .enter()
      .append('path')
      .classed('v-brush-handle', true)
      .attr('cursor', 'ew-resize')
      .attr('stroke', 'white')
      .attr('d', (d) => {
        const e = +(d.type === 'e')
        const h = height * 2
        const x = e ? 1 : -1
        const y = 0
        return [
          `M ${0.5 * x} ${y}`,
          `A 6 6 0 0 ${e} ${6.5 * x} ${y + 6}`,
          `V ${y + h - 6}`,
          `A 6 6 0 0 ${e} ${0.5 * x} ${y + h}`,
          'Z',
          `M ${2.5 * x} ${y + 8}`,
          `V ${y + h - 8}`,
          `M ${4.5 * x} ${y + 8}`,
          `V ${y + h - 8}`,
        ].join(' ')
      })
  }, [series, current, theme, dimensions, currentSelection, previousSelection, onBrushDomainChange, currentZoomState])

  return (
    <div ref={wrapperRef}>
      <SVG ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>
        <g id="content" clipPath={`url(#${id})`} />
        <g id="brush" clipPath={`url(#${id})`} />
        <g id="x-axis" />
        <g id="y-axis" />
      </SVG>
    </div>
  )
}
