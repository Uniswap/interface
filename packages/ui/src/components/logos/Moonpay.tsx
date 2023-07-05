import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Rect, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#7D00FF',
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 36 36" width={size} {...svgProps}>
      <Rect fill={color ?? '#7D00FF'} height="36" rx="18" width="36" />
      <Path
        d="M24.933 14.14a3.07 3.07 0 0 0 0-6.14 3.07 3.07 0 0 0 0 6.14ZM15.5 28A7.495 7.495 0 0 1 8 20.493a7.495 7.495 0 0 1 7.5-7.506c4.149 0 7.5 3.354 7.5 7.506A7.495 7.495 0 0 1 15.5 28Z"
        fill={color ?? '#fff'}
      />
    </Svg>
  )
})

Icon.displayName = 'Moonpay'

export const Moonpay = memo<IconProps>(Icon)
