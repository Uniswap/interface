import { Line, LineProps, Svg } from 'react-native-svg'

interface DottedLineProps {
  strokeWidth?: LineProps['strokeWidth']
  strokeColor?: LineProps['stroke']
  strokeDasharray?: LineProps['strokeDasharray']
}

/**
 * Vertical dotted line separator that isn't generated from a SVG file.
 */
export function VerticalDottedLineSeparator({
  strokeWidth = 2,
  strokeColor = 'gray',
  strokeDasharray = '1 3',
}: DottedLineProps): JSX.Element {
  const halfStrokeWidth = typeof strokeWidth === 'number' ? strokeWidth / 2 : 1

  return (
    <Svg height="100%" width="100%">
      <Line
        x1={halfStrokeWidth}
        y1={halfStrokeWidth}
        x2={halfStrokeWidth}
        y2="100%"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
      />
    </Svg>
  )
}
