import { ScaleLinear } from 'd3'
import styled from 'lib/styled-components'

const StyledLine = styled.line<{ strokeDasharray: string }>`
  opacity: 0.5;
  stroke-width: 1;
  stroke: ${({ theme }) => theme.neutral2};
  stroke-dasharray: ${({ strokeDasharray }) => strokeDasharray};
  fill: none;
`

export const HorizontalLine = ({
  value,
  yScale,
  width,
  containerWidth,
  lineStyle = 'dashed',
}: {
  value: number
  yScale: ScaleLinear<number, number>
  width: number
  containerWidth: number
  lineStyle?: 'solid' | 'dashed'
}) => {
  const lineStart = containerWidth - width

  if (isNaN(lineStart)) {
    return null
  }

  const strokeDasharray = lineStyle === 'dashed' ? '1, 4' : 'none'

  return (
    <StyledLine
      strokeDasharray={strokeDasharray}
      y1={yScale(value)}
      x1={lineStart}
      y2={yScale(value)}
      x2={lineStart + width}
    />
  )
}
