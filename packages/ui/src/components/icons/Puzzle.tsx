import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = isWeb ? 'currentColor' : undefined,
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size = typeof sizeProp === 'string' ? getTokenValue(sizeProp, 'size') : sizeProp

  const strokeWidth =
    typeof strokeWidthProp === 'string' ? getTokenValue(strokeWidthProp, 'size') : strokeWidthProp

  const color =
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill={color} height={size} viewBox="0 0 48 48" width={size} {...svgProps}>
      <Path d="M0 0h48v48H0z" fill="none" />
      <Path d="M41 22h-3v-8c0-2.21-1.79-4-4-4h-8V7c0-2.76-2.24-5-5-5s-5 2.24-5 5v3H8c-2.21 0-3.98 1.79-3.98 4l-.01 7.6H7c2.98 0 5.4 2.42 5.4 5.4S9.98 32.4 7 32.4H4.01L4 40c0 2.21 1.79 4 4 4h7.6v-3c0-2.98 2.42-5.4 5.4-5.4 2.98 0 5.4 2.42 5.4 5.4v3H34c2.21 0 4-1.79 4-4v-8h3c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </Svg>
  )
})

Icon.displayName = 'Puzzle'

export const Puzzle = memo<IconProps>(Icon)
