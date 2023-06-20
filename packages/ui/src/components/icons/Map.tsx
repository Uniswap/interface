import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { G, Path, Svg } from 'react-native-svg'
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
      <G clipPath="url(#clip0_8270_157937)">
        <Path
          d="M0.833252 5.00008V18.3334L6.66659 15.0001L13.3333 18.3334L19.1666 15.0001V1.66675L13.3333 5.00008L6.66659 1.66675L0.833252 5.00008Z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M0.833252 5.00008V18.3334L6.66659 15.0001L13.3333 18.3334L19.1666 15.0001V1.66675L13.3333 5.00008L6.66659 1.66675L0.833252 5.00008Z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <Path
          d="M6.66675 1.66675V15.0001"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M6.66675 1.66675V15.0001"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <Path
          d="M13.3333 5V18.3333"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M13.3333 5V18.3333"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
      </G>
    </Svg>
  )
}

Icon.displayName = 'Map'

export const Map = memo<IconProps>(Icon)
