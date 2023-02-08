import { NumberValue, ScaleLinear, axisBottom, Axis as d3Axis, select } from 'd3'
import Numeral from 'numeral'
import { useMemo } from 'react'
import styled from 'styled-components'

const StyledGroup = styled.g`
  line {
    display: none;
  }

  text {
    color: ${({ theme }) => theme.text2};
    transform: translateY(5px);
  }
`

const Axis = ({ axisGenerator }: { axisGenerator: d3Axis<NumberValue> }) => {
  const axisRef = (axis: SVGGElement) => {
    axis &&
      select(axis)
        .call(axisGenerator)
        .call(g => g.select('.domain').remove())
  }

  return <g ref={axisRef} />
}

export const AxisBottom = ({
  xScale,
  innerHeight,
  offset = 0,
}: {
  xScale: ScaleLinear<number, number>
  innerHeight: number
  offset?: number
}) => {
  return useMemo(
    () => (
      <StyledGroup transform={`translate(0, ${innerHeight + offset})`}>
        <Axis
          axisGenerator={axisBottom(xScale)
            .tickFormat(domainValue => {
              const number = Numeral(domainValue.toString())
              return domainValue.valueOf() > 1e10 || domainValue.valueOf() < -1e10
                ? number.format('0e+0')
                : domainValue.toString()
            })
            .ticks(6)}
        />
      </StyledGroup>
    ),
    [innerHeight, offset, xScale],
  )
}
