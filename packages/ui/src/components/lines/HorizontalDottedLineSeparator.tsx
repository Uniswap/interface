import { Line, LineProps, Svg } from 'react-native-svg'

interface DottedLineProps {
  strokeWidth?: number
  strokeColor?: LineProps['stroke']
  strokeDasharray?: LineProps['strokeDasharray']
}

/**
 * Horizontal dotted line separator that isn't generated from a SVG file.
 *
 * example:
 * const WIDTH_OF_DOTTED_LINE = 100;
 * <Flex width={WIDTH_OF_DOTTED_LINE}>
 *   <HorizontalDottedLineSeparator strokeWidth={2} />
 * </Flex>
 *
 * or
 *
 * <Flex flex={1}>
 *   <HorizontalDottedLineSeparator strokeWidth={2} />
 * </Flex>
 *
 */
export function HorizontalDottedLineSeparator({
  strokeWidth = 2,
  strokeColor = 'gray',
  strokeDasharray,
}: DottedLineProps): JSX.Element {
  const halfStrokeWidth = strokeWidth / 2
  const _strokeDasharray = strokeDasharray ?? `0 ${strokeWidth * 2}`

  return (
    <Svg width="100%" height={strokeWidth}>
      <Line
        x1={halfStrokeWidth}
        y1={halfStrokeWidth}
        x2="100%"
        y2={halfStrokeWidth}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={_strokeDasharray}
      />
    </Svg>
  )
}
