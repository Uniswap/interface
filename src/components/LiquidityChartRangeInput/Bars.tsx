import React, { useMemo } from 'react'
import { ScaleLinear } from 'd3'
import styled from 'styled-components'
import { ChartEntry } from './types'

const Rect = styled.rect`
  opacity: 0.5;
  stroke-width: 2;
  stroke: ${({ theme }) => theme.text1};
  fill: ${({ theme }) => theme.blue1};
  opacity: 0.5;
`

export const Bars = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  innerHeight,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  innerHeight: number
}) =>
  useMemo(
    () => (
      <g>
        {series.map((d: ChartEntry, i: number) => (
          <Rect
            key={i}
            x={xScale(xValue(d))}
            y={yScale(yValue(d))}
            width="18"
            height={innerHeight - yScale(yValue(d))}
          />
        ))}
      </g>
    ),
    [series, xScale, xValue, innerHeight, yScale, yValue]
  )
