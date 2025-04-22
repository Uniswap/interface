import { NumberValue, ScaleLinear, axisRight, Axis as d3Axis, select } from 'd3'
import styled from 'lib/styled-components'
import { useMemo } from 'react'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const StyledGroup = styled.g`
  line {
    display: none;
  }

  text {
    color: ${({ theme }) => theme.neutral2};
  }
`

const TEXT_Y_OFFSET = 5

const Axis = ({
  axisGenerator,
  yScale,
  height,
}: {
  axisGenerator: d3Axis<NumberValue>
  height: number
  yScale: ScaleLinear<number, number>
}) => {
  const axisRef = (axis: SVGGElement) => {
    if (axis) {
      select(axis)
        .call(axisGenerator)
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g.selectAll('text').attr('transform', function (d) {
            const yCoordinate = yScale(d as number)
            if (yCoordinate < TEXT_Y_OFFSET) {
              return `translate(0, ${TEXT_Y_OFFSET})`
            }
            if (yCoordinate > height - TEXT_Y_OFFSET) {
              return `translate(0, ${-TEXT_Y_OFFSET})`
            }
            return ''
          }),
        )
    }
  }

  return <g ref={axisRef} />
}

export const AxisRight = ({
  yScale,
  offset = 0,
  min,
  current,
  max,
  height,
}: {
  yScale: ScaleLinear<number, number>
  height: number
  offset?: number
  min?: number
  current?: number
  max?: number
}) => {
  const { formatNumber } = useFormatter()
  const tickValues = useMemo(() => {
    const minCoordinate = min ? yScale(min) : undefined
    const maxCoordinate = max ? yScale(max) : undefined
    const currentCoordinate = current ? yScale(current) : undefined
    if (minCoordinate && currentCoordinate && Math.abs(minCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean) as number[]
    }
    if (maxCoordinate && currentCoordinate && Math.abs(maxCoordinate - currentCoordinate) < TEXT_Y_OFFSET) {
      return [min, max].filter(Boolean) as number[]
    }
    return [min, current, max].filter(Boolean) as number[]
  }, [current, max, min, yScale])

  return (
    <StyledGroup transform={`translate(${offset}, 0)`}>
      <Axis
        axisGenerator={axisRight(yScale)
          .tickValues(tickValues)
          .tickFormat((d) =>
            formatNumber({
              input: d as number,
              type: NumberType.TokenQuantityStats,
            }),
          )}
        height={height}
        yScale={yScale}
      />
    </StyledGroup>
  )
}
