import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Circle as _Circle, Path, Svg } from 'react-native-svg'
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <_Circle cx="12" cy="12" fill={color ?? '#EDF0F4'} r="12" />
      <Path
        d="M11.9673 4.8L11.8718 5.12426V14.5326L11.9673 14.6278L16.3344 12.0464L11.9673 4.8Z"
        fill={color ?? '#343434'}
      />
      <Path
        d="M11.9672 4.8L7.59998 12.0464L11.9672 14.6278V10.0613V4.8Z"
        fill={color ?? '#8C8C8C'}
      />
      <Path
        d="M11.9673 15.4547L11.9135 15.5203V18.8717L11.9673 19.0287L16.3371 12.8746L11.9673 15.4547Z"
        fill={color ?? '#3C3C3B'}
      />
      <Path
        d="M11.9672 19.0287V15.4547L7.59998 12.8746L11.9672 19.0287Z"
        fill={color ?? '#8C8C8C'}
      />
      <Path
        d="M11.9673 14.6278L16.3344 12.0464L11.9673 10.0613V14.6278Z"
        fill={color ?? '#141414'}
      />
      <Path
        d="M7.59998 12.0464L11.9672 14.6278V10.0613L7.59998 12.0464Z"
        fill={color ?? '#393939'}
      />
    </Svg>
  )
})

Icon.displayName = 'EthLightIcon'

export const EthLightIcon = memo<IconProps>(Icon)
