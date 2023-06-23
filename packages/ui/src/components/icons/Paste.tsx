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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 15 14" width={size} {...svgProps}>
      <Path
        d="M8.0835 1.16602H4.00016C3.69074 1.16602 3.394 1.28893 3.1752 1.50772C2.95641 1.72652 2.8335 2.02326 2.8335 2.33268V11.666C2.8335 11.9754 2.95641 12.2722 3.1752 12.491C3.394 12.7098 3.69074 12.8327 4.00016 12.8327H11.0002C11.3096 12.8327 11.6063 12.7098 11.8251 12.491C12.0439 12.2722 12.1668 11.9754 12.1668 11.666V5.24935L8.0835 1.16602Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M8.0835 1.16602V5.24935H12.1668"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  )
})

Icon.displayName = 'Paste'

export const Paste = memo<IconProps>(Icon)
