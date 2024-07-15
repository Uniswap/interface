import { ScaleLinear } from 'd3'
import styled from 'lib/styled-components'
import { useMemo } from 'react'

const StyledLine = styled.line`
  opacity: 0.5;
  stroke-width: 2;
  stroke: ${({ theme }) => theme.neutral1};
  fill: none;
`

export const Line = ({
  value,
  xScale,
  innerHeight,
}: {
  value: number
  xScale: ScaleLinear<number, number>
  innerHeight: number
}) =>
  useMemo(
    () => <StyledLine x1={xScale(value)} y1="0" x2={xScale(value)} y2={innerHeight} />,
    [value, xScale, innerHeight],
  )
