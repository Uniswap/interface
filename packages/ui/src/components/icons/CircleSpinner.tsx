import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Circle as _Circle, Path, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon: React.FC<IconProps> = (props) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#99A1BD',
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size = typeof sizeProp === 'string' ? getTokenValue(sizeProp, 'size') : sizeProp

  const strokeWidth =
    typeof strokeWidthProp === 'string' ? getTokenValue(strokeWidthProp, 'size') : strokeWidthProp

  const color = colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M21 12C21 7.02944 16.9706 3 12 3"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="3"
      />
      <_Circle cx="12" cy="12" fill={color ?? '#99A1BD'} fillOpacity="0.14" r="6" />
    </Svg>
  )
}

Icon.displayName = 'CircleSpinner'

export const CircleSpinner = memo<IconProps>(Icon)
