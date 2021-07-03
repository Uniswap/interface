import React, { useMemo } from 'react'
import { ScaleLinear } from 'd3'
import styled from 'styled-components'
import { ChartEntry } from './types'
import { inRange } from 'lodash'

const Rect = styled.rect`
  /* stroke-width: 2; */
  /* stroke: ${({ theme }) => theme.text1}; */
  fill: ${({ theme }) => theme.blue1};
  opacity: 0.5;
`

export const Bars = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  innerWidth,
  innerHeight,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
  innerWidth: number
  innerHeight: number
}) =>
  useMemo(
    () => (
      <g>
        {series
          // filter points that are in view to calculate width
          .filter((d) => inRange(xScale(xValue(d)), 0, innerWidth))
          .map((d: ChartEntry, i: number, filtered) => (
            <Rect
              key={i}
              x={xScale(xValue(d))}
              y={yScale(yValue(d))}
              width={Math.floor(innerWidth / filtered.length)}
              height={innerHeight - yScale(yValue(d))}
            />
          ))}
      </g>
    ),
    [series, xScale, xValue, innerWidth, yScale, yValue, innerHeight]
  )
