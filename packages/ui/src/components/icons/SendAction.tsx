import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon: React.FC<IconProps> = (props) => {
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

  const color = colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 20 20" width={size} {...svgProps}>
      <Path
        d="M19.671 3.66918L16.3911 16.7893C15.9211 18.6593 14.321 19.4993 12.921 19.4993C12.911 19.4993 12.9011 19.4993 12.9011 19.4993C11.4911 19.4893 9.88107 18.6293 9.44107 16.7393L8.58108 13.0893L13.9611 7.70922C14.3511 7.31922 14.3511 6.6793 13.9611 6.2893C13.5711 5.8993 12.931 5.8993 12.541 6.2893L7.16104 11.6692L3.51107 10.8093C1.62107 10.3693 0.761065 8.75937 0.751065 7.35937C0.741065 5.94937 1.58109 4.32937 3.46109 3.85937L16.5811 0.57934C17.4511 0.35934 18.3611 0.609262 19.0011 1.24926C19.6411 1.88926 19.891 2.79918 19.671 3.66918Z"
        fill={color}
      />
    </Svg>
  )
}

Icon.displayName = 'SendAction'

export const SendAction = memo<IconProps>(Icon)
