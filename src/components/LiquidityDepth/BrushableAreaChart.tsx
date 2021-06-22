import React, { useEffect, useRef, useState } from 'react'
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
  id?: string

  data: ChartEntry[]

  dimensions: Dimensions

  style: {
    fill?: string
    stroke?: string
  }

  brushDomain: [number, number] | undefined
  onBrushDomainChange: (domain: [number, number]) => void
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

export function BrushableAreaChart({
  id = 'myBrushableAreaChart',
  data,
  dimensions,
  style: { fill, stroke },
  brushDomain = [0, 10],
  onBrushDomainChange,
}: BrushableAreaChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [currentSelection, setCurrentSelection] = useState(brushDomain)
  const previousSelection = usePrevious(brushDomain)

  useEffect(() => {
    setCurrentSelection(brushDomain)
  }, [brushDomain])

  // will be called initially, and on every data change
  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current || data.length === 0) return

    // @ts-ignore
    function brushed({ type, selection }) {
      // @ts-ignore
      if (selection === null || selection[0] === NaN || selection[1] === NaN) {
        return
      }

      const newSelection = selection.map(xScale.invert)

      if (type === 'end') {
        onBrushDomainChange(newSelection)
      }

      setCurrentSelection(newSelection)
      // @ts-ignore
      //select(this).call(brushHandle, currentSelection)
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

    if (previousSelection === currentSelection) {
      svg
        .select('#brush')
        // @ts-ignore
        .call(brush)
        // @ts-ignore
        .call(brush.move, currentSelection.map(xScale))
    }
  }, [data, fill, stroke, dimensions, currentSelection, previousSelection, onBrushDomainChange])

  return (
    <div ref={wrapperRef}>
      <SVG ref={svgRef}>
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width="100%" height="100%" />
          </clipPath>
        </defs>
        <g id="content" clipPath={`url(#${id})`} />
        <g id="brush" />
        <g id="x-axis" />
        <g id="y-axis" />
      </SVG>
    </div>
  )
}
