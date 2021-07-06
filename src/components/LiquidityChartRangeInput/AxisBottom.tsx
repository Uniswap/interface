import React, { useMemo } from 'react'
import { Axis as d3Axis, axisBottom, NumberValue, ScaleLinear, select } from 'd3'
import styled from 'styled-components/macro'

const StyledGroup = styled.g`
  line {
    color: ${({ theme }) => theme.text1};
    opacity: 0.3;
  }

  text {
    color: ${({ theme }) => theme.text2};
    transform: translateY(15px);
  }
`

const Axis = ({ axisGenerator }: { axisGenerator: d3Axis<NumberValue> }) => {
  const axisRef = (axis: SVGGElement) => {
    axis &&
      select(axis)
        .call(axisGenerator)
        .call((g) => g.select('.domain').remove())
  }

  return <g ref={axisRef} />
}

export const AxisBottom = ({
  xScale,
  innerHeight,
  offset = -8,
}: {
  xScale: ScaleLinear<number, number>
  innerHeight: number
  offset?: number
}) =>
  useMemo(
    () => (
      <StyledGroup transform={`translate(0, ${innerHeight + offset})`}>
        <Axis axisGenerator={axisBottom(xScale).ticks(8).tickSize(8)} />
      </StyledGroup>
    ),
    [innerHeight, offset, xScale]
  )
