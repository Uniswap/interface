import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Defs, G, Path, Rect, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon: React.FC<IconProps> = (props) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#FC72FF',
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
    <Svg fill="none" height={size} viewBox="0 0 20 20" width={size} {...svgProps}>
      <G clipPath="url(#clip0_2274_114663)">
        <Path
          d="M10.0674 13.0165L10.0002 20.6066L10.0674 13.0165ZM4.51472 12.7651L15.2494 12.6699L15.267 10.6883L12.8441 8.72837L13.3854 2.77867L6.55435 2.8392L6.98976 8.78083L4.53228 10.7835L4.51472 12.7651Z"
          fill={color ?? '#FC72FF'}
        />
        <Path
          d="M10.0674 13.0165L10.0002 20.6066M4.51472 12.7651L15.2494 12.6699L15.267 10.6883L12.8441 8.72837L13.3854 2.77867L6.55435 2.8392L6.98976 8.78083L4.53228 10.7835L4.51472 12.7651Z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
      <Defs>
        <clipPath id="clip0_2274_114663">
          <Rect fill="white" height="20" width="20" />
        </clipPath>
      </Defs>
    </Svg>
  )
}

Icon.displayName = 'Pin'

export const Pin = memo<IconProps>(Icon)
