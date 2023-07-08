import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Circle as _Circle, Path, Svg } from 'react-native-svg'
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 80 81" width={size} {...svgProps}>
      <Path
        d="M40.084 24.7017C42.8068 32.0598 48.6082 37.8613 55.9664 40.584C48.6082 43.3068 42.8068 49.1082 40.084 56.4664C37.3613 49.1082 31.5598 43.3068 24.2017 40.584C31.5598 37.8613 37.3613 32.0598 40.084 24.7017Z"
        fill={color}
      />
      <_Circle cx="39.9999" cy="74.7858" fill={color} r="5.71429" />
    </Svg>
  )
})

Icon.displayName = 'LoadingSpinnerInner'

export const LoadingSpinnerInner = memo<IconProps>(Icon)
