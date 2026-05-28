import { memo } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Line } from 'react-native-svg'
import { useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'

// Equal horizontal and vertical spacing, multiple of 4px
const SPACING = 20
const DOT_SIZE = 1.5

export const DotGrid = memo(function DotGrid({
  width,
  height,
  opacity = 1,
}: {
  width: number
  height: number
  opacity?: number
}): JSX.Element {
  const colors = useSporeColors()
  const numRows = Math.floor(height / SPACING) + 1
  const dotColor = opacify(25, colors.neutral3.val)
  // Right-align columns so the rightmost dot always lands at the right edge.
  // Any partial gap on the left is masked by the gradient overlay in PortfolioChart.
  const xOffset = width % SPACING

  return (
    <Svg width={width} height={height} style={[StyleSheet.absoluteFill, { opacity }]}>
      {Array.from({ length: numRows }, (_, i) => (
        <Line
          key={i}
          x1={xOffset}
          y1={i * SPACING}
          x2={width}
          y2={i * SPACING}
          stroke={dotColor}
          strokeWidth={DOT_SIZE}
          strokeLinecap="round"
          strokeDasharray={`0 ${SPACING}`}
        />
      ))}
    </Svg>
  )
})
