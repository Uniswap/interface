import React, { useMemo } from 'react'
import { area, curveStep, interpolateOranges, ScaleLinear } from 'd3'
import styled from 'styled-components'
import { ChartEntry } from './types'
import { inRange } from 'lodash'

const Path = styled.path`
  opacity: 0.5;
  stroke: ${({ theme }) => theme.blue2};
  fill: ${({ theme }) => theme.blue2};
`

export const Area = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
}: {
  series: ChartEntry[]
  xScale: ScaleLinear<number, number>
  yScale: ScaleLinear<number, number>
  xValue: (d: ChartEntry) => number
  yValue: (d: ChartEntry) => number
}) =>
  useMemo(
    () => (
      <Path
        d={
          area()
            .curve(curveStep)
            .x((d: unknown) => xScale(xValue(d as ChartEntry)))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(
            series.filter((d) => inRange(xScale(xValue(d)), 0, innerWidth)) as Iterable<[number, number]>
          ) ?? undefined
        }
      />
    ),
    [series, xScale, xValue, yScale, yValue]
  )
