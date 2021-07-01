import React, { useMemo } from 'react'
import { ScaleLinear } from 'd3'
import styled from 'styled-components'

const Tick = styled.text`
  font-size: 10px;
  opacity: 0.6;
  fill: ${({ theme }) => theme.text1};
`

export const AxisBottom = ({
  xScale,
  innerHeight,
  tickOffset = 15,
}: {
  xScale: ScaleLinear<number, number>
  innerHeight: number
  tickOffset?: number
}) =>
  useMemo(
    () => (
      <g>
        {xScale.ticks(6).map((tickValue) => (
          <g key={tickValue} transform={`translate(${xScale(tickValue)}, 0)`}>
            <Tick style={{ textAnchor: 'middle' }} dy=".71em" y={innerHeight + tickOffset}>
              {tickValue}
            </Tick>
          </g>
        ))}
      </g>
    ),
    [innerHeight, tickOffset, xScale]
  )
