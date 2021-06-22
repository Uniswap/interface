import React, { useEffect, useRef, useState } from 'react'
import { useWindowSize } from 'hooks/useWindowSize'
import { ChartEntry } from './hooks'
import { select, scaleLinear, max, axisBottom, area, curveStep, brushX, min } from 'd3'
import usePrevious from 'hooks/usePrevious'
import styled from 'styled-components'

interface Dimensions {
  width: number
  height: number
  boundedWidth: number
  boundedHeight: number
}

interface BrushableAreaChartProps {
  dimensions: Dimensions
  style: {
    fill?: string
    stroke?: string
  }
  data: ChartEntry[]
}

const SVG = styled.svg`
  overflow: visible;
`

const xAccessor = (d: ChartEntry) => d.price0
const yAccessor = (d: ChartEntry) => d.activeLiquidity

const getScales = (data: ChartEntry[], width: number, height: number) => {
  return {
    xScale: scaleLinear()
      .domain([min(data, xAccessor), max(data, xAccessor)] as number[])
      .range([0, width]),
    yScale: scaleLinear()
      .domain([0, max(data, yAccessor)] as number[])
      .range([height, 0]),
  }
}

//const brushHandle = (g: SVGGElement, selection: [[number, number]]): SVGGElement =>
//g.selectAll('.handle--custom')

export function BrushableAreaChart({ data, dimensions, style: { fill, stroke } }: BrushableAreaChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [brushSelection, setBrushSelection] = useState([0, 0])

  const previousSelection = usePrevious(brushSelection)

  // will be called initially, and on every data change
  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current || data.length === 0) return

    // @ts-ignore
    function brushed({ selection }) {
      // @ts-ignore
      if (selection === null) {
      } else {
        const [x0, x1] = selection.map(xScale.invert)
        setBrushSelection([x0, x1])
        console.log(brushSelection)
      }

      // @ts-ignore
      //select(this).call(brushHandle, brushSelection)
    }

    const svg = select(svgRef.current)
    const { width, height } = dimensions || wrapperRef.current.getBoundingClientRect()

    // scales + area generator
    const { xScale, yScale } = getScales(data, width, height)

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
      .data([data])
      .join('path')
      .attr('class', 'area')
      .attr('fill', fill ?? 'transparent')
      .attr('stroke', stroke ?? 'transparent')
      .attr('stroke-width', 1.6)
      // @ts-ignore
      .attr('d', areaGenerator)

    // axes
    const xAxis = axisBottom(xScale)
    svg
      .select('#x-axis')
      .style('transform', `translateY(${height}px)`)
      // @ts-ignore
      .call(xAxis)

    // brush
    const brush = brushX()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('start brush end', brushed)

    if (previousSelection === brushSelection) {
      svg
        .select('#brush')
        // @ts-ignore
        .call(brush)
        // @ts-ignore
        .call(brush.move, brushSelection.map(xScale))
    }
  }, [data, fill, stroke, dimensions, brushSelection, previousSelection])

  return (
    <div ref={wrapperRef}>
      <SVG ref={svgRef}>
        <g id="content" />
        <g id="x-axis" />
        <g id="y-axis" />
        <g id="brush" />
      </SVG>
    </div>
  )
}
