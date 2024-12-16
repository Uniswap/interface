import { ScaleLinear } from 'd3'
import styled from 'lib/styled-components'

const StyledLine = styled.line`
  opacity: 0.5;
  stroke-width: 1;
  stroke: ${({ theme }) => theme.neutral2};
  stroke-dasharray: '2, 5';
  fill: none;
`

export const HorizontalLine = ({
  value,
  yScale,
  xScale,
  width,
}: {
  value: number
  yScale: ScaleLinear<number, number>
  xScale: ScaleLinear<number, number>
  width: number
}) => {
  const lineStart = xScale(0)
  if (isNaN(lineStart)) {
    return null
  }
  return (
    <StyledLine
      style={{ strokeDasharray: '1, 4' }}
      y1={yScale(value)}
      x1={lineStart}
      y2={yScale(value)}
      x2={lineStart + width}
    />
  )
}
