import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Circle as _Circle, Defs, G, Path, Rect, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#EDF0F4',
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      sizeProp,
      'size'
    ) ?? sizeProp

  const strokeWidth =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      strokeWidthProp,
      'size'
    ) ?? strokeWidthProp

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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 20 20" width={size} {...svgProps}>
      <G clipPath="url(#clip0_2_30)">
        <Rect fill={color ?? '#EDF0F4'} height="20" width="20" />
        <_Circle cx="10" cy="10" fill={color ?? '#EDF0F4'} r="10" />
        <Path
          d="M9.97278 4L9.89323 4.27021V12.1105L9.97278 12.1899L13.6121 10.0386L9.97278 4Z"
          fill={color ?? '#343434'}
        />
        <Path d="M9.97272 4L6.33333 10.0386L9.97272 12.1899V8.38441V4Z" fill={color ?? '#8C8C8C'} />
        <Path
          d="M9.97273 12.8789L9.92789 12.9336V15.7264L9.97273 15.8573L13.6143 10.7288L9.97273 12.8789Z"
          fill={color ?? '#3C3C3B'}
        />
        <Path
          d="M9.97272 15.8573V12.8789L6.33333 10.7288L9.97272 15.8573Z"
          fill={color ?? '#8C8C8C'}
        />
        <Path
          d="M9.97266 12.1899L13.612 10.0386L9.97266 8.38441V12.1899Z"
          fill={color ?? '#141414'}
        />
        <Path
          d="M6.33333 10.0386L9.97272 12.1899V8.38441L6.33333 10.0386Z"
          fill={color ?? '#393939'}
        />
      </G>
      <Defs>
        <clipPath id="clip0_2_30">
          <Rect fill="white" height="20" width="20" />
        </clipPath>
      </Defs>
    </Svg>
  )
})

Icon.displayName = 'EthereumLogo'

export const EthereumLogo = memo<IconProps>(Icon)
