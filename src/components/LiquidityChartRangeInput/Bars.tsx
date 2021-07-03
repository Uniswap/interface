import React, { useMemo } from 'react'
import { ScaleLinear } from 'd3'
import styled from 'styled-components'
import { ChartEntry } from './types'
import { inRange } from 'lodash'

const Rect = styled.rect<{ selected: boolean; current: boolean }>`
  fill: ${({ theme }) => theme.blue1};
  opacity: ${({ selected, current }) => (current ? '.6' : selected ? '0.6' : '0.4')};
`

export const Bars = ({
  series,
  current,
  brushExtent,
  xScale,
  yScale,
  xValue,
  yValue,
  innerWidth,
  innerHeight,
}: {
  series: ChartEntry[]
  current: number
  brushExtent: [number, number]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  innerWidth: number
  innerHeight: number
}) => {
  const filtered = useMemo(
    () =>
      series
        // filter points that are in view to calculate width
        .filter((d) => inRange(xScale(xValue(d)), 0, innerWidth)),
    [innerWidth, series, xScale, xValue]
  )

  const barWdith = useMemo(() => innerWidth / filtered.length, [filtered, innerWidth])

  return useMemo(
    () => (
      <g>
        {filtered.map((d: ChartEntry, i: number) => (
          <Rect
            key={i}
            x={xScale(xValue(d))}
            y={yScale(yValue(d))}
            width={barWdith}
            height={innerHeight - yScale(yValue(d))}
            selected={inRange(xScale(xValue(d)) + barWdith, xScale(brushExtent[0]), xScale(brushExtent[1]) + barWdith)}
            current={inRange(xScale(current), xScale(xValue(d)), xScale(xValue(d)) + barWdith)}
          />
        ))}
      </g>
    ),
    [filtered, xScale, xValue, yScale, yValue, barWdith, innerHeight, brushExtent, current]
  )
}
