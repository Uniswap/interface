import { Line, LineProps, Svg } from 'react-native-svg'

interface DottedLineProps {
  strokeWidth?: number
  strokeColor?: LineProps['stroke']
  strokeDasharray?: LineProps['strokeDasharray']
}

/**
 * Vertical dotted line separator that isn't generated from a SVG file.
 *
 * example:
 * const HEIGHT_OF_DOTTED_LINE = 100;
 * <Flex height={HEIGHT_OF_DOTTED_LINE}>
 *   <VerticalDottedLineSeparator strokeWidth={2} />
 * </Flex>
 *
 * or
 *
 * <Flex flex={1}>
 *   <VerticalDottedLineSeparator strokeWidth={2} />
 * </Flex>
 *
 */
export function VerticalDottedLineSeparator({
  strokeWidth = 2,
  strokeColor = 'gray',
  strokeDasharray,
}: DottedLineProps): JSX.Element {
  const halfStrokeWidth = strokeWidth / 2
  const _strokeDasharray = strokeDasharray ?? `0 ${strokeWidth * 2}`

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
        strokeDasharray={_strokeDasharray}
      />
    </Svg>
  )
}
